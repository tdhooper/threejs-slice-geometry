var THREE = require('three');
var sliceGeometry = require('../slice.js')(THREE);

describe("three.js slice geometry", function() {
    "use strict";

    var geometry;

    var faceVertices = function(geom) {
        return geom.faces.map(function(face) {
            return ['a', 'b', 'c'].map(function(key) {
                return geom.vertices[face[key]];
            });
        });
    };

    var lerpNormals = function(face, a, b, alpha) {
        var v1 = face.vertexNormals[a];
        var v2 = face.vertexNormals[b];
        return v1.clone().lerp(v2, alpha).normalize();
    };

    var faceVerticesAndNormals = function(geom) {
        var geomCopy = geom.clone();
        var points;
        var uvs = geom.faceVertexUvs[0];
        geomCopy.computeFaceNormals();
        var compareArray = function(a, b) {
            for (var i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return a[i] - b[i];
                }
            }
            return 0;
        };
        var comparePoints = function(a, b) {
            return compareArray(a.vertex, b.vertex);
        };
        return geomCopy.faces.map(function(face, faceIndex) {
            points = ['a', 'b', 'c'].map(function(key, i) {
                return {
                    vertex: geomCopy.vertices[face[key]].toArray(),
                    normal: face.vertexNormals[i].toArray(),
                    uv: uvs[faceIndex] ? uvs[faceIndex][i] : null,
                };
            }).sort(comparePoints);
            return {
                points: points,
                normal: face.normal.toArray()
            };
        }).sort();
    };

    beforeEach(function() {
        jasmine.addMatchers({
            objectToBeCloseTo: function(util, customEqualityTesters) {
                var iterate = function(actual, expected, precision) {
                    var result = true;
                    var equal;
                    for (var property in actual) {
                        if (actual.hasOwnProperty(property)) {
                            if (typeof actual[property] == "object") {
                                result = iterate(actual[property], expected[property], precision);
                            } else {
                                equal = Math.abs(expected[property] - actual[property]) < (Math.pow(10, -precision) / 2);
                                if ( ! equal) {
                                    result = "Expected " + actual[property] + " to be close to " + expected[property];
                                }
                            }
                            if (result !== true) {
                                return result;
                            }
                        }
                    }
                    return result;
                };
                return {
                    compare: function(actual, expected, precision) {
                        var result = iterate(actual, expected, precision);
                        if (result !== true) {
                            return {
                                pass: false,
                                message: result
                            };
                        }
                        return {
                            pass: true
                        };
                    }
                };
            }
        });
    });

    describe("a single face", function() {

        beforeEach(function() {
            geometry = new THREE.Geometry();

            geometry.vertices = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0, 1, 0)
            ];

            var normals = [
                new THREE.Vector3(0, 0, 1).normalize(),
                new THREE.Vector3(1, 0, 1).normalize(),
                new THREE.Vector3(0, 1, 1).normalize()
            ];

            geometry.faces = [
                new THREE.Face3(0, 1, 2, normals)
            ];

            geometry.faceVertexUvs[0] = [
                [
                    new THREE.Vector2(0, 0),
                    new THREE.Vector2(1, 0),
                    new THREE.Vector2(0, 1)
                ]
            ];
        });

        it("sliced with whole geometry behind plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                -2
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices.length).toBe(0);
            expect(sliced.faces.length).toBe(0);
            expect(sliced.faceVertexUvs[0].length).toBe(0);
        });

        it("sliced with whole geometry in front of plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                2
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices).toEqual(geometry.vertices);
            expect(sliced.faces).toEqual(geometry.faces);
            expect(sliced.faceVertexUvs).toEqual(geometry.faceVertexUvs);
        });

        it("sliced with whole geometry behind and touching plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(-1, 0, 0),
                0
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices.length).toBe(0);
            expect(sliced.faces.length).toBe(0);
            expect(sliced.faceVertexUvs[0].length).toBe(0);
        });

        it("sliced with whole geometry in front of and touching plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                0
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices).toEqual(geometry.vertices);
            expect(sliced.faces).toEqual(geometry.faces);
            expect(sliced.faceVertexUvs).toEqual(geometry.faceVertexUvs);
        });

        it("sliced with one vertex in front of plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0).normalize(),
                -0.5
            );
            var sliced = sliceGeometry(geometry, plane);
            var expected = new THREE.Geometry();
            expected.vertices = [
                new THREE.Vector3(0.5, 0, 0),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0.5, 0.5, 0)
            ];
            var normals = [
                lerpNormals(geometry.faces[0], 0, 1, 0.5),
                new THREE.Vector3(1, 0, 1).normalize(),
                lerpNormals(geometry.faces[0], 1, 2, 0.5)
            ];
            expected.faces = [
                new THREE.Face3(0, 1, 2, normals)
            ];
            expected.faceVertexUvs[0] = [
                [
                    new THREE.Vector2(0.5, 0),
                    new THREE.Vector2(1, 0),
                    new THREE.Vector2(0.5, 0.5)
                ]
            ];
            expect(faceVerticesAndNormals(sliced)).toEqual(faceVerticesAndNormals(expected));
        });

        it("sliced with two vertices in front of plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(-1, 0, 0).normalize(),
                0.5
            );
            var sliced = sliceGeometry(geometry, plane);
            var expected = new THREE.Geometry();
            expected.vertices = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0.5, 0, 0),
                new THREE.Vector3(0.5, 0.5, 0),
                new THREE.Vector3(0, 1, 0)
            ];
            var normals = [
                [
                    new THREE.Vector3(0, 0, 1).normalize(),
                    lerpNormals(geometry.faces[0], 0, 1, 0.5),
                    lerpNormals(geometry.faces[0], 1, 2, 0.5)
                ],[
                    new THREE.Vector3(0, 0, 1).normalize(),
                    lerpNormals(geometry.faces[0], 1, 2, 0.5),
                    new THREE.Vector3(0, 1, 1).normalize()
                ]
            ];
            expected.faceVertexUvs[0] = [
                [
                    new THREE.Vector2(0, 0),
                    new THREE.Vector2(0.5, 0),
                    new THREE.Vector2(0.5, 0.5)
                ],[
                    new THREE.Vector2(0, 0),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0, 1)
                ]
            ];
            expected.faces = [
                new THREE.Face3(0, 1, 2, normals[0]),
                new THREE.Face3(0, 2, 3, normals[1])
            ];
            expect(faceVerticesAndNormals(sliced)).toEqual(faceVerticesAndNormals(expected));
        });

        it("sliced with all vertices touching plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(0, 0, 1),
                0
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices).toEqual(geometry.vertices);
            expect(sliced.faces).toEqual(geometry.faces);
            expect(sliced.faceVertexUvs).toEqual(geometry.faceVertexUvs);
        });
    });


    describe("two faces", function() {

        beforeEach(function() {
            geometry = new THREE.Geometry();

            geometry.vertices = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(1, 1, 0)
            ];

            var normals = [
                [
                    new THREE.Vector3(0, 0, 1).normalize(),
                    new THREE.Vector3(1, 0, 1).normalize(),
                    new THREE.Vector3(0, 1, 1).normalize()
                ],[
                    new THREE.Vector3(1, 1, 1).normalize(),
                    new THREE.Vector3(0, 1, 1).normalize(),
                    new THREE.Vector3(1, 0, 1).normalize()
                ]
            ];

            geometry.faces = [
                new THREE.Face3(0, 1, 2, normals[0]),
                new THREE.Face3(3, 2, 1, normals[1])
            ];

            geometry.faceVertexUvs[0] = [
                [
                    new THREE.Vector2(0, 0),
                    new THREE.Vector2(1, 0),
                    new THREE.Vector2(0, 1)
                ],[
                    new THREE.Vector2(1, 1),
                    new THREE.Vector2(0, 1),
                    new THREE.Vector2(1, 0)
                ]
            ];
        });

        it("sliced with whole geometry behind plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                -2
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices.length).toBe(0);
            expect(sliced.faces.length).toBe(0);
        });

        it("sliced with whole geometry in front of plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                2
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices).toEqual(geometry.vertices);
            expect(sliced.faces).toEqual(geometry.faces);
        });

        it("sliced with one face on either side", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 1, 0).normalize(),
                Math.sqrt(2) / -2
            );
            var sliced = sliceGeometry(geometry, plane);
            var expected = new THREE.Geometry();
            expected.vertices = [
                new THREE.Vector3(1, 1, 0),
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(1, 0, 0)
            ];
            var normals = [
                new THREE.Vector3(1, 1, 1).normalize(),
                new THREE.Vector3(0, 1, 1).normalize(),
                new THREE.Vector3(1, 0, 1).normalize()
            ];
            expected.faces = [
                new THREE.Face3(0, 1, 2, normals)
            ];
            expected.faceVertexUvs[0] = [
                [
                    new THREE.Vector2(1, 1),
                    new THREE.Vector2(0, 1),
                    new THREE.Vector2(1, 0)
                ]
            ];
            expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
        });
    });


    describe("bare minimum geometry", function() {

        beforeEach(function() {
            geometry = new THREE.Geometry();

            geometry.vertices = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0, 1, 0)
            ];

            geometry.faces = [
                new THREE.Face3(0, 1, 2)
            ];
        });

        it("sliced with whole geometry in front of plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                2
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices).toEqual(geometry.vertices);
            expect(sliced.faces).toEqual(geometry.faces);
            expect(sliced.faceVertexUvs).toEqual(geometry.faceVertexUvs);
        });
    });
});
