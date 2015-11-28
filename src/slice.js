(function() {
    "use strict";

    var FRONT = 'front';
    var BACK = 'back';

    window.sliceGeometry = function(geom, plane) {
        var sliced = new THREE.Geometry();
        var vertices;
        var position;
        geom.faces.forEach(function(face) {
            vertices = faceVertices(geom, face);
            position = facePosition(plane, vertices);
            if (position == FRONT) {
                addFace(sliced, vertices);
            }
        });
        return sliced;
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

    var facePosition = function(plane, vertices) {
        var position = FRONT;
        vertices.forEach(function(vertex) {
            if (plane.distanceToPoint(vertex) < 0) {
                position = BACK;
            }
        });
        return position;
    };

})();
