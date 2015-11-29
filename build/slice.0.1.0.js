(function() {
    "use strict";

    var FRONT = 'front';
    var BACK = 'back';
    var STRADDLE = 'straddle';
    var ON = 'on';

    window.sliceGeometry = function(geom, plane) {
        var sliced = new THREE.Geometry();
        var points;
        var position;
        geom.faces.forEach(function(face) {
            points = facePoints(geom, face);
            position = facePosition(plane, points);
            if (position == FRONT) {
                addFace(sliced, points);
            } else if (position == STRADDLE) {
                sliceFace(plane, sliced, points);
            }
        });
        return sliced;
    };

    var sliceFace = function(plane, geom, points) {
        var i;
        var len = points.length;
        var p1;
        var p2;
        var intersection;
        var position1;
        var position2;
        var slicePoints = [];

        for (i = 0; i < len; i++) {
            p1 = points[i];
            p2 = i + 1 < len ? points[i + 1] : points[0];
            intersection = intersectPlane(p1, p2, plane);
            position1 = vertexPosition(plane, p1.vertex);
            position2 = vertexPosition(plane, p2.vertex);
            if (position1 == FRONT && slicePoints.indexOf(p1) === -1) {
                slicePoints.push(p1);
            }
            if (intersection) {
                slicePoints.push(intersection);
            }
            if (position2 == FRONT && slicePoints.indexOf(p2) === -1) {
                slicePoints.push(p2);
            }
        }

        if (slicePoints.length > 3) {
            addFace(geom, [
                slicePoints[0],
                slicePoints[1],
                slicePoints[2],
            ]);
            addFace(geom, [
                slicePoints[2],
                slicePoints[3],
                slicePoints[0],
            ]);
        } else {
            addFace(geom, slicePoints);
        }
    };

    var addFace = function(geom, points) {
        var existingIndex;
        var vertexIndices = [];
        var indexOffset = geom.vertices.length;
        var exists;
        var normals = [];

        points.forEach(function(point) {
            existingIndex = geom.vertices.indexOf(point.vertex);
            if (existingIndex !== -1) {
                vertexIndices.push(existingIndex);
            } else {
                geom.vertices.push(point.vertex);
                vertexIndices.push(indexOffset);
                indexOffset += 1;
            }
            if (point.normal) {
                normals.push(point.normal);
            }
            return ! exists;
        });

        var face = new THREE.Face3(
            vertexIndices[0],
            vertexIndices[1],
            vertexIndices[2],
            normals
        );
        geom.faces.push(face);
    };

    var facePoints = function(geom, face) {
        return ['a', 'b', 'c'].map(function(key, i) {
            return {
                vertex: geom.vertices[face[key]],
                normal: face.vertexNormals[i]
            };
        });
    };

    var intersectPlane = function(p1, p2, plane) {
        var line = new THREE.Line3(p1.vertex, p2.vertex);
        var intersection = plane.intersectLine(line);
        if (intersection) {
            var distance = p1.vertex.distanceTo(intersection);
            var alpha = distance / line.distance();
            var n = p1.normal.clone().lerp(p2.normal, alpha).normalize();
            // console.log(p1.normal.toArray(), p2.normal.toArray(), alpha);
            // console.log(n.toArray());
            return {
                vertex: intersection,
                normal: n
            };
        }
    };

    var facePosition = function(plane, points) {
        var a = vertexPosition(plane, points[0].vertex);
        var b = vertexPosition(plane, points[1].vertex);
        var c = vertexPosition(plane, points[2].vertex);
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
