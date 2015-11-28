(function() {
    "use strict";

    var FRONT = 'front';
    var BACK = 'back';
    var STRADDLE = 'straddle';
    var ON = 'on';

    window.sliceGeometry = function(geom, plane) {
        var sliced = new THREE.Geometry();
        var vertices;
        var position;
        geom.faces.forEach(function(face) {
            vertices = faceVertices(geom, face);
            position = facePosition(plane, vertices);
            if (position == FRONT) {
                addFace(sliced, vertices);
            } else if (position == STRADDLE) {
                sliceFace(plane, sliced, vertices);
            }
        });
        return sliced;
    };

    var sliceFace = function(plane, geom, vertices) {
        var i;
        var len = vertices.length;
        var v1;
        var v2;
        var intersection;
        var position1;
        var position2;
        var sliceVertices = [];

        for (i = 0; i < len; i++) {
            v1 = vertices[i];
            v2 = i + 1 < len ? vertices[i + 1] : vertices[0];
            intersection = intersectPlane(v1, v2, plane);
            position1 = vertexPosition(plane, v1);
            position2 = vertexPosition(plane, v2);
            if (position1 == FRONT && sliceVertices.indexOf(v1) === -1) {
                sliceVertices.push(v1);
            }
            if (intersection) {
                sliceVertices.push(intersection);
            }
            if (position2 == FRONT && sliceVertices.indexOf(v2) === -1) {
                sliceVertices.push(v2);
            }
        }

        if (sliceVertices.length > 3) {
            addFace(geom, [
                sliceVertices[0],
                sliceVertices[1],
                sliceVertices[2],
            ]);
            addFace(geom, [
                sliceVertices[2],
                sliceVertices[3],
                sliceVertices[0],
            ]);
        } else {
            addFace(geom, sliceVertices);
        }
    };

    var addFace = function(geom, vertices) {
        var existingIndex;
        var vertexIndices = [];
        var indexOffset = geom.vertices.length;
        var exists;

        vertices.forEach(function(vertex) {
            existingIndex = geom.vertices.indexOf(vertex);
            if (existingIndex !== -1) {
                vertexIndices.push(existingIndex);
            } else {
                geom.vertices.push(vertex);
                vertexIndices.push(indexOffset);
                indexOffset += 1;
            }
            return ! exists;
        });

        var face = new THREE.Face3(
            vertexIndices[0],
            vertexIndices[1],
            vertexIndices[2]
        );
        geom.faces.push(face);
    };

    var faceVertices = function(geom, face) {
        return ['a', 'b', 'c'].map(function(key) {
            return geom.vertices[face[key]];
        });
    };

    var intersectPlane = function(v1, v2, plane) {
        var line = new THREE.Line3(v1, v2);
        return plane.intersectLine(line);
    };

    var facePosition = function(plane, vertices) {
        var a = vertexPosition(plane, vertices[0]);
        var b = vertexPosition(plane, vertices[1]);
        var c = vertexPosition(plane, vertices[2]);
        if (a == BACK || b == BACK || c == BACK) {
            if (a == FRONT || b == FRONT || c == FRONT) {
                return STRADDLE;
            }
            return BACK;
        }
        if (a == FRONT || b == FRONT || c == FRONT) {
            if (a == BACK || b == BACK || c == BACK) {
                return STRADDLE;
            }
            return FRONT;
        }
        return ON;
    };

    var vertexPosition = function(plane, vertex) {
        var distance = plane.distanceToPoint(vertex);
        if (distance < 0) {
            return BACK;
        }
        if (distance > 0) {
            return FRONT;
        }
        return ON;
    };

})();
