module.exports = function(THREE) {
    "use strict";

    var FRONT = 'front';
    var BACK = 'back';
    var ON = 'on';

    var sliceGeometry = function(geom, plane) {
        var sliced = new THREE.Geometry();
        var modifier = new GeometryModifier(geom, sliced);

        var distances = [];
        var positions = [];

        geom.vertices.forEach(function(vertex) {
            var distance = findDistance(vertex, plane);
            var position = distanceAsPosition(distance);
            distances.push(distance);
            positions.push(position);
        });

        geom.faces.forEach(function(face, faceIndex) {

            var facePositions = ['a', 'b', 'c'].map(function(key) {
                return positions[face[key]];
            });

            if (
                facePositions.indexOf(FRONT) === -1 &&
                facePositions.indexOf(BACK) !== -1
            ) {
                return;
            }

            modifier.startFace(faceIndex);

            var lastKey = 'c';
            var lastIndex = face[lastKey];
            var lastDistance = distances[lastIndex];
            var lastPosition = positions[lastIndex];

            ['a', 'b', 'c'].map(function(key) {
                var index = face[key];
                var distance = distances[index];
                var position = positions[index];
                
                if (position === FRONT) {
                    if (lastPosition === BACK) {
                        modifier.addIntersection(lastKey, key, lastDistance, distance);
                        modifier.addVertex(key);
                    } else {
                        modifier.addVertex(key);
                    }
                }

                if (position === ON) {
                    modifier.addVertex(key);
                }

                if (position === BACK && lastPosition === FRONT) {
                    modifier.addIntersection(lastKey, key, lastDistance, distance);
                }

                lastKey = key;
                lastIndex = index;
                lastPosition = position;
                lastDistance = distance;
            });

            modifier.endFace();
        });

        return sliced;
    };

    var GeometryModifier = function(sourceGeometry, targetGeometry) {
        this.sourceGeometry = sourceGeometry;
        this.targetGeometry = targetGeometry;
        this.addedVertices = [];
        this.addedIntersections = [];
    };

    GeometryModifier.prototype.startFace = function(sourceFaceIndex) {
        this.sourceFaceIndex = sourceFaceIndex;
        this.sourceFace = this.sourceGeometry.faces[sourceFaceIndex];
        this.sourceFaceUvs = this.sourceGeometry.faceVertexUvs[0][sourceFaceIndex];

        this.faceIndicies = [];
        this.faceNormals = [];
        this.faceUvs = [];
    };

    GeometryModifier.prototype.endFace = function() {
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

    GeometryModifier.prototype.addFacePart = function(a, b, c) {
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

    GeometryModifier.prototype.addVertex = function(key) {
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

    GeometryModifier.prototype.addIntersection = function(keyA, keyB, distanceA, distanceB) {
        var t = Math.abs(distanceA) / (Math.abs(distanceA) + Math.abs(distanceB));
        this.addIntersectionUv(keyA, keyB, t);
        this.addIntersectionNormal(keyA, keyB, t);

        var indexA = this.sourceFace[keyA];
        var indexB = this.sourceFace[keyB];
        var id = this.intersectionId(indexA, indexB);

        if (this.addedIntersections.hasOwnProperty(id)) {
            this.faceIndicies.push(this.addedIntersections[id]);
            return;
        }

        var vertexA = this.sourceGeometry.vertices[indexA];
        var vertexB = this.sourceGeometry.vertices[indexB];
        var newVertex = vertexA.clone().lerp(vertexB, t);
        this.targetGeometry.vertices.push(newVertex);
        var newIndex = this.targetGeometry.vertices.length - 1;
        this.addedIntersections[id] = newIndex;
        this.faceIndicies.push(newIndex);
    };

    GeometryModifier.prototype.addUv = function(key) {
        if ( ! this.sourceFaceUvs) {
            return;
        }
        var index = ['a', 'b', 'c'].indexOf(key);
        var uv = this.sourceFaceUvs[index];
        this.faceUvs.push(uv);
    };

    GeometryModifier.prototype.addIntersectionUv = function(keyA, keyB, t) {
        if ( ! this.sourceFaceUvs) {
            return;
        }
        var indexA = ['a', 'b', 'c'].indexOf(keyA);
        var indexB = ['a', 'b', 'c'].indexOf(keyB);
        var uvA = this.sourceFaceUvs[indexA];
        var uvB = this.sourceFaceUvs[indexB];
        var uv = uvA.clone().lerp(uvB, t);
        this.faceUvs.push(uv);
    };

    GeometryModifier.prototype.addNormal = function(key) {
        if ( ! this.sourceFace.vertexNormals.length) {
            return;
        }
        var index = ['a', 'b', 'c'].indexOf(key);
        var normal = this.sourceFace.vertexNormals[index];
        this.faceNormals.push(normal);
    };

    GeometryModifier.prototype.addIntersectionNormal = function(keyA, keyB, t) {
        if ( ! this.sourceFace.vertexNormals.length) {
            return;
        }
        var indexA = ['a', 'b', 'c'].indexOf(keyA);
        var indexB = ['a', 'b', 'c'].indexOf(keyB);
        var normalA = this.sourceFace.vertexNormals[indexA];
        var normalB = this.sourceFace.vertexNormals[indexB];
        var normal = normalA.clone().lerp(normalB, t).normalize();
        this.faceNormals.push(normal);
    };

    GeometryModifier.prototype.intersectionId = function(indexA, indexB) {
        return [indexA, indexB].sort().join(',');
    };

    GeometryModifier.prototype.faceEdgeLength = function(a, b) {
        var indexA = this.faceIndicies[a];
        var indexB = this.faceIndicies[b];
        var vertexA = this.targetGeometry.vertices[indexA];
        var vertexB = this.targetGeometry.vertices[indexB];
        return vertexA.distanceToSquared(vertexB);
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

    return sliceGeometry;
};
