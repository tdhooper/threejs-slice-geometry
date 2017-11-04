var facesFromEdges = require('./faces-from-edges.js');


module.exports = function(THREE) {
    "use strict";

    var FRONT = 'front';
    var BACK = 'back';
    var ON = 'on';

    var FACE_KEYS = ['a', 'b', 'c'];

    var sliceGeometry = function(geometry, plane, closeHoles) {
        var sliced = new THREE.Geometry();
        var builder = new GeometryBuilder(geometry, sliced);

        var distances = [];
        var positions = [];

        geometry.vertices.forEach(function(vertex) {
            var distance = findDistance(vertex, plane);
            var position = distanceAsPosition(distance);
            distances.push(distance);
            positions.push(position);
        });

        geometry.faces.forEach(function(face, faceIndex) {

            var facePositions = FACE_KEYS.map(function(key) {
                return positions[face[key]];
            });

            if (
                facePositions.indexOf(FRONT) === -1 &&
                facePositions.indexOf(BACK) !== -1
            ) {
                return;
            }

            builder.startFace(faceIndex);

            var lastKey = FACE_KEYS[FACE_KEYS.length - 1];
            var lastIndex = face[lastKey];
            var lastDistance = distances[lastIndex];
            var lastPosition = positions[lastIndex];

            FACE_KEYS.map(function(key) {
                var index = face[key];
                var distance = distances[index];
                var position = positions[index];
                
                if (position === FRONT) {
                    if (lastPosition === BACK) {
                        builder.addIntersection(lastKey, key, lastDistance, distance);
                        builder.addVertex(key);
                    } else {
                        builder.addVertex(key);
                    }
                }

                if (position === ON) {
                    builder.addVertex(key);
                }

                if (position === BACK && lastPosition === FRONT) {
                    builder.addIntersection(lastKey, key, lastDistance, distance);
                }

                lastKey = key;
                lastIndex = index;
                lastPosition = position;
                lastDistance = distance;
            });

            builder.endFace();
        });

        if (closeHoles) {
            builder.closeHoles();
        }

        return sliced;
    };

    var distanceAsPosition = function(distance) {
        if (distance < 0) {
            return BACK;
        }
        if (distance > 0) {
            return FRONT;
        }
        return ON;
    };

    var findDistance = function(vertex, plane) {
        return plane.distanceToPoint(vertex);
    };

    var GeometryBuilder = function(sourceGeometry, targetGeometry) {
        this.sourceGeometry = sourceGeometry;
        this.targetGeometry = targetGeometry;
        this.addedVertices = [];
        this.addedIntersections = [];
        this.newEdges = [[]];
    };

    GeometryBuilder.prototype.startFace = function(sourceFaceIndex) {
        this.sourceFaceIndex = sourceFaceIndex;
        this.sourceFace = this.sourceGeometry.faces[sourceFaceIndex];
        this.sourceFaceUvs = this.sourceGeometry.faceVertexUvs[0][sourceFaceIndex];

        this.faceIndicies = [];
        this.faceNormals = [];
        this.faceUvs = [];
    };

    GeometryBuilder.prototype.endFace = function() {
        if (this.faceIndicies.length > 3) {
            var lengthA = this.faceEdgeLength(0, 2);
            var lengthB = this.faceEdgeLength(1, 3);
            if (lengthA < lengthB) {
                this.addFacePart(0, 1, 2);
                this.addFacePart(0, 2, 3);
            } else {
                this.addFacePart(1, 2, 3);
                this.addFacePart(0, 1, 3);
            }
        } else {
            this.addFacePart(0, 1, 2);
        }
    };

    GeometryBuilder.prototype.closeHoles = function() {
        facesFromEdges(this.newEdges)
            .forEach(function(faceIndicies) {
                var face = new THREE.Face3(
                    faceIndicies[0],
                    faceIndicies[2],
                    faceIndicies[1]
                );
                this.targetGeometry.faces.push(face);
            }, this);
    };

    GeometryBuilder.prototype.addVertex = function(key) {
        this.addUv(key);
        this.addNormal(key);

        var index = this.sourceFace[key];

        if (this.addedVertices.hasOwnProperty(index)) {
            this.faceIndicies.push(this.addedVertices[index]);
            return;
        }

        var vertex = this.sourceGeometry.vertices[index];
        this.targetGeometry.vertices.push(vertex);
        var newIndex = this.targetGeometry.vertices.length - 1;
        this.addedVertices[index] = newIndex;
        this.faceIndicies.push(newIndex);
    };

    GeometryBuilder.prototype.addIntersection = function(keyA, keyB, distanceA, distanceB) {
        var t = Math.abs(distanceA) / (Math.abs(distanceA) + Math.abs(distanceB));
        this.addIntersectionUv(keyA, keyB, t);
        this.addIntersectionNormal(keyA, keyB, t);

        var indexA = this.sourceFace[keyA];
        var indexB = this.sourceFace[keyB];
        var id = this.intersectionId(indexA, indexB);
        var index;

        if (this.addedIntersections.hasOwnProperty(id)) {
            index = this.addedIntersections[id];
        } else {
            var vertexA = this.sourceGeometry.vertices[indexA];
            var vertexB = this.sourceGeometry.vertices[indexB];
            var newVertex = vertexA.clone().lerp(vertexB, t);
            this.targetGeometry.vertices.push(newVertex);
            index = this.targetGeometry.vertices.length - 1;
            this.addedIntersections[id] = index;
        }
        this.faceIndicies.push(index);
        this.updateNewEdges(index);
    };

    GeometryBuilder.prototype.addUv = function(key) {
        if ( ! this.sourceFaceUvs) {
            return;
        }
        var index = this.keyIndex(key);
        var uv = this.sourceFaceUvs[index];
        this.faceUvs.push(uv);
    };

    GeometryBuilder.prototype.addIntersectionUv = function(keyA, keyB, t) {
        if ( ! this.sourceFaceUvs) {
            return;
        }
        var indexA = this.keyIndex(keyA);
        var indexB = this.keyIndex(keyB);
        var uvA = this.sourceFaceUvs[indexA];
        var uvB = this.sourceFaceUvs[indexB];
        var uv = uvA.clone().lerp(uvB, t);
        this.faceUvs.push(uv);
    };

    GeometryBuilder.prototype.addNormal = function(key) {
        if ( ! this.sourceFace.vertexNormals.length) {
            return;
        }
        var index = this.keyIndex(key);
        var normal = this.sourceFace.vertexNormals[index];
        this.faceNormals.push(normal);
    };

    GeometryBuilder.prototype.addIntersectionNormal = function(keyA, keyB, t) {
        if ( ! this.sourceFace.vertexNormals.length) {
            return;
        }
        var indexA = this.keyIndex(keyA);
        var indexB = this.keyIndex(keyB);
        var normalA = this.sourceFace.vertexNormals[indexA];
        var normalB = this.sourceFace.vertexNormals[indexB];
        var normal = normalA.clone().lerp(normalB, t).normalize();
        this.faceNormals.push(normal);
    };

    GeometryBuilder.prototype.addFacePart = function(a, b, c) {
        var normals = null;
        if (this.faceNormals.length) {
            normals = [
                this.faceNormals[a],
                this.faceNormals[b],
                this.faceNormals[c],
            ];
        }
        var face = new THREE.Face3(
            this.faceIndicies[a],
            this.faceIndicies[b],
            this.faceIndicies[c],
            normals
        );
        this.targetGeometry.faces.push(face);
        if ( ! this.sourceFaceUvs) {
            return;
        }
        this.targetGeometry.faceVertexUvs[0].push([
            this.faceUvs[a],
            this.faceUvs[b],
            this.faceUvs[c]
        ]);
    };

    GeometryBuilder.prototype.faceEdgeLength = function(a, b) {
        var indexA = this.faceIndicies[a];
        var indexB = this.faceIndicies[b];
        var vertexA = this.targetGeometry.vertices[indexA];
        var vertexB = this.targetGeometry.vertices[indexB];
        return vertexA.distanceToSquared(vertexB);
    };

    GeometryBuilder.prototype.intersectionId = function(indexA, indexB) {
        return [indexA, indexB].sort().join(',');
    };

    GeometryBuilder.prototype.keyIndex = function(key) {
        return FACE_KEYS.indexOf(key);
    };

    GeometryBuilder.prototype.updateNewEdges = function(index) {
        var edgeIndex = this.newEdges.length - 1;
        var edge = this.newEdges[edgeIndex];
        if (edge.length < 2) {
            edge.push(index);
        } else {
            this.newEdges.push([index]);
        }
    };

    return sliceGeometry;
};
