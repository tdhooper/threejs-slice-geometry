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

        geom.faces.forEach(function(face) {
            var newFace = [];

            var facePositions = ['a', 'b', 'c'].map(function(key) {
                return positions[face[key]];
            });

            if (
                facePositions.indexOf(FRONT) === -1 &&
                facePositions.indexOf(BACK) !== -1
            ) {
                return;
            }

            var lastIndex = face.c;
            var lastDistance = distances[lastIndex];
            var lastPosition = positions[lastIndex];

            ['a', 'b', 'c'].map(function(key) {
                var index = face[key];
                var distance = distances[index];
                var position = positions[index];
                
                if (position === FRONT) {
                    if (lastPosition === BACK) {
                        newFace.push(modifier.addIntersection(lastIndex, index, lastDistance, distance));
                        newFace.push(modifier.addVertex(index));
                    } else {
                        newFace.push(modifier.addVertex(index));
                    }
                }

                if (position === ON) {
                    newFace.push(modifier.addVertex(index));
                }

                if (position === BACK && lastPosition === FRONT) {
                    newFace.push(modifier.addIntersection(lastIndex, index, lastDistance, distance));
                }

                lastIndex = index;
                lastPosition = position;
                lastDistance = distance;
            });

            if (newFace.length) {
                modifier.addFace(newFace);
            }
        });

        return sliced;
    };

    var GeometryModifier = function(sourceGeometry, targetGeometry) {
        this.sourceGeometry = sourceGeometry;
        this.targetGeometry = targetGeometry;
        this.addedVertices = [];
        this.addedIntersections = [];
        this.normals = [];
    };

    GeometryModifier.prototype.addFace = function(indicies) {
        if (indicies.length > 3) {
            var lengthA = this.edgeLength(indicies[0], indicies[2]);
            var lengthB = this.edgeLength(indicies[1], indicies[3]);
            if (lengthA < lengthB) {
                this.addFace([
                    indicies[0],
                    indicies[1],
                    indicies[2]
                ]);
                this.addFace([
                    indicies[0],
                    indicies[2],
                    indicies[3]
                ]);
            } else {
                this.addFace([
                    indicies[1],
                    indicies[2],
                    indicies[3]
                ]);
                this.addFace([
                    indicies[0],
                    indicies[1],
                    indicies[3]
                ]);
            }
        } else {
            this.targetGeometry.faces.push(new THREE.Face3(
                indicies[0],
                indicies[1],
                indicies[2]
            ));
        }
        
    };

    GeometryModifier.prototype.addVertex = function(index) {
        if (this.addedVertices.hasOwnProperty(index)) {
            return this.addedVertices[index];
        }
        var vertex = this.sourceGeometry.vertices[index];
        this.targetGeometry.vertices.push(vertex);
        var newIndex = this.targetGeometry.vertices.length - 1;
        this.addedVertices[index] = newIndex;
        return newIndex;
    };

    GeometryModifier.prototype.addIntersection = function(indexA, indexB, distanceA, distanceB) {
        var id = this.intersectionId(indexA, indexB);
        if (this.addedIntersections.hasOwnProperty(id)) {
            return this.addedIntersections[id];
        }
        var vertexA = this.sourceGeometry.vertices[indexA];
        var vertexB = this.sourceGeometry.vertices[indexB];
        var t = Math.abs(distanceA) / (Math.abs(distanceA) + Math.abs(distanceB));
        var newVertex = vertexA.clone().lerp(vertexB, t);
        this.targetGeometry.vertices.push(newVertex);
        var newIndex = this.targetGeometry.vertices.length - 1;
        this.addedIntersections[id] = newIndex;
        return newIndex;
    };

    GeometryModifier.prototype.intersectionId = function(indexA, indexB) {
        return [indexA, indexB].sort().join(',');
    };

    GeometryModifier.prototype.edgeLength = function(indexA, indexB) {
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
