var THREE = require('three');
var sliceGeometry = require('../slice.js')(THREE);
var facesFromEdges = require('../faces-from-edges.js');


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
                var o = {};
                o.vertex = geomCopy.vertices[face[key]].toArray();
                o.normal = face.vertexNormals[i] ? face.vertexNormals[i].toArray() : null;
                o.uv = uvs[faceIndex] ? uvs[faceIndex][i] : null;
                return o;
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
                var iterate = function(actual, expected, precision, path) {
                    var result = true;
                    var equal;
                    for (var property in expected) {
                        if (expected.hasOwnProperty(property)) {
                            if (typeof expected[property] == "object") {
                                var path2 = path + '.' + property;
                                result = iterate(actual[property], expected[property], precision, path2);
                            } else if (typeof expected[property] != "number") {
                                result = expected[property] === actual[property];
                            } else {
                                equal = Math.abs(expected[property] - actual[property]) < (Math.pow(10, -precision) / 2);
                                
                                if ( ! equal) {
                                    result = "Expected " + actual[property] + ", but got " + expected[property];
                                    result += "\n" + expected + ' : ' + actual;
                                    result += '\n path: ' + path;
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
                        var result = iterate(actual, expected, precision, '');
                        if (result !== true) {
                            var message = result;
                            // message += '\n\nExpected:\n\n';
                            // message += JSON.stringify(expected, null, '\t');
                            // message += '\n\nActual:\n\n';
                            // message += JSON.stringify(actual, null, '\t');
                            // message += '\n\n';
                            return {
                                pass: false,
                                message: message
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

        /*

          2  _______  3
            |⟍      |
            |  ⟍    |
            |    ⟍  |
            |______⟍|
          0           1

        */

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

            /*

              2  _______  0
                 ⟍      |
                   ⟍    |
                     ⟍  |
                       ⟍|
                          1

            */


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

        it("sliced through both faces", function() {

            /*

              3  ___2____ 4
                |  ⟋ ⟍  |
                |⟋_____⟍|
              0           1

            */

            var plane = new THREE.Plane(
                new THREE.Vector3(0, -1, 0).normalize(),
                .5
            );
            var sliced = sliceGeometry(geometry, plane);
            var expected = new THREE.Geometry();
            expected.vertices = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(.5, .5, 0),
                new THREE.Vector3(0, .5, 0),
                new THREE.Vector3(1, .5, 0)
            ];
            var normals = [
                [
                    new THREE.Vector3(0, 0, 1).normalize(),
                    new THREE.Vector3(1, 0, 1).normalize(),
                    new THREE.Vector3(.5, .5, 1).normalize()
                ],[
                    new THREE.Vector3(0, 0, 1).normalize(),
                    new THREE.Vector3(.5, .5, 1).normalize(),
                    (
                        new THREE.Vector3(0, 0, 1).normalize().lerp(
                            new THREE.Vector3(0, 1, 1).normalize(),
                            .5
                        ).normalize()
                    )
                ],[
                    new THREE.Vector3(1, 0, 1).normalize(),
                    (
                        new THREE.Vector3(1, 0, 1).normalize().lerp(
                            new THREE.Vector3(1, 1, 1).normalize(),
                            .5
                        ).normalize()
                    ),
                    new THREE.Vector3(.5, .5, 1).normalize()
                ]
            ];
            expected.faces = [
                new THREE.Face3(0, 1, 2, normals[0]),
                new THREE.Face3(0, 2, 3, normals[1]),
                new THREE.Face3(1, 4, 2, normals[2])
            ];
            expected.faceVertexUvs[0] = [
                [
                    new THREE.Vector2(0, 0),
                    new THREE.Vector2(1, 0),
                    new THREE.Vector2(.5, .5)
                ],[
                    new THREE.Vector2(0, 0),
                    new THREE.Vector2(.5, .5),
                    new THREE.Vector2(0, .5)
                ],[
                    new THREE.Vector2(1, 0),
                    new THREE.Vector2(1, .5),
                    new THREE.Vector2(.5, .5)
                ]
            ];
            expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
            expect(sliced.vertices.length).toBe(5);
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

        it("sliced with whole geometry in front of plane, with closing holes", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                2
            );
            var sliced = sliceGeometry(geometry, plane, true);
            expect(sliced.vertices).toEqual(geometry.vertices);
            expect(sliced.faces).toEqual(geometry.faces);
            expect(sliced.faceVertexUvs).toEqual(geometry.faceVertexUvs);
        });
    });

    describe("closed geometry", function() {

        beforeEach(function() {
            geometry = new THREE.Geometry();

            geometry.vertices = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(0, 0, 1),
            ];

            geometry.faces = [
                new THREE.Face3(0, 2, 1),
                new THREE.Face3(0, 3, 2),
                new THREE.Face3(1, 2, 3),
                new THREE.Face3(0, 1, 3),
            ];
        });

        describe("sliced with one vertex in front of plane", function() {

            it("without closing holes", function() {

                var plane = new THREE.Plane().setFromCoplanarPoints(
                    new THREE.Vector3(.5, 0, 0),
                    new THREE.Vector3(.5, .5, 0),
                    new THREE.Vector3(.5, 0, .5)
                );
                var sliced = sliceGeometry(geometry, plane);
                var expected = new THREE.Geometry();
                expected.vertices = [
                    new THREE.Vector3(.5, 0, 0),
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(.5, .5, 0),
                    new THREE.Vector3(.5, 0, .5)
                ];
                expected.faces = [
                    new THREE.Face3(0, 2, 1),
                    new THREE.Face3(1, 2, 3),
                    new THREE.Face3(0, 1, 3)
                ];
                expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
            });

            it("with closing holes", function() {

                var plane = new THREE.Plane().setFromCoplanarPoints(
                    new THREE.Vector3(.5, 0, 0),
                    new THREE.Vector3(.5, .5, 0),
                    new THREE.Vector3(.5, 0, .5)
                );
                var sliced = sliceGeometry(geometry, plane, true);
                var expected = new THREE.Geometry();
                expected.vertices = [
                    new THREE.Vector3(.5, 0, 0),
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(.5, .5, 0),
                    new THREE.Vector3(.5, 0, .5)
                ];
                expected.faces = [
                    new THREE.Face3(0, 2, 1),
                    new THREE.Face3(1, 2, 3),
                    new THREE.Face3(0, 1, 3),
                    new THREE.Face3(0, 3, 2)
                ];
                expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
            });
        });

        describe("sliced with three vertices in front of plane", function() {

            it("without closing holes", function() {

                var plane = new THREE.Plane().setFromCoplanarPoints(
                    new THREE.Vector3(.5, .5, 0),
                    new THREE.Vector3(.5, 0, 0),
                    new THREE.Vector3(.5, 0, .5)
                );
                var sliced = sliceGeometry(geometry, plane);
                var expected = new THREE.Geometry();
                expected.vertices = [
                    new THREE.Vector3(0.5, 0, 0),
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(0.5, 0.5, 0),
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(0.5, 0, 0.5)
                ];
                expected.faces = [
                    new THREE.Face3(1, 2, 3),
                    new THREE.Face3(3, 0, 1),
                    new THREE.Face3(1, 4, 2),
                    new THREE.Face3(5, 3, 2),
                    new THREE.Face3(2, 4, 5),
                    new THREE.Face3(1, 0, 5),
                    new THREE.Face3(5, 4, 1)
                ];
                expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
                expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
            });

            it("with closing holes", function() {

                var plane = new THREE.Plane().setFromCoplanarPoints(
                    new THREE.Vector3(.5, .5, 0),
                    new THREE.Vector3(.5, 0, 0),
                    new THREE.Vector3(.5, 0, .5)
                );
                var sliced = sliceGeometry(geometry, plane, true);
                var expected = new THREE.Geometry();
                expected.vertices = [
                    new THREE.Vector3(0.5, 0, 0),
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(0.5, 0.5, 0),
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(0.5, 0, 0.5)
                ];
                expected.faces = [
                    new THREE.Face3(1, 2, 3),
                    new THREE.Face3(3, 0, 1),
                    new THREE.Face3(1, 4, 2),
                    new THREE.Face3(5, 3, 2),
                    new THREE.Face3(2, 4, 5),
                    new THREE.Face3(1, 0, 5),
                    new THREE.Face3(5, 4, 1),
                    new THREE.Face3(5, 0, 3)
                ];
                expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
            });
        });
    });

    describe("closed geometry with large slice area", function() {

        beforeEach(function() {
            geometry = new THREE.Geometry();

            geometry.vertices = [
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(.75, 0, .75),
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(-.75, 0, .75),
                new THREE.Vector3(-1, 0, 0)
            ];

            geometry.faces = [
                new THREE.Face3(0, 2, 1),
                new THREE.Face3(0, 3, 2),
                new THREE.Face3(0, 4, 3),
                new THREE.Face3(0, 5, 4),
                new THREE.Face3(0, 1, 5)
            ];
        });

        describe("sliced with one vertex in front of plane", function() {

            it("without closing holes", function() {

                var plane = new THREE.Plane(
                    new THREE.Vector3(0, -1, 0).normalize(),
                    .5
                );
                var sliced = sliceGeometry(geometry, plane);
                var expected = new THREE.Geometry();
                expected.vertices = [
                    new THREE.Vector3(0.5, 0.5, 0),
                    new THREE.Vector3(0.375, 0.5, 0.375),
                    new THREE.Vector3(0.75, 0, 0.75),
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(0, 0.5, 0.5),
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(-0.375, 0.5, 0.375),
                    new THREE.Vector3(-0.75, 0, 0.75),
                    new THREE.Vector3(-0.5, 0.5, 0),
                    new THREE.Vector3(-1, 0, 0)
                ];
                expected.faces = [
                    new THREE.Face3(1, 2, 3),
                    new THREE.Face3(3, 0, 1),
                    new THREE.Face3(1, 4, 5),
                    new THREE.Face3(5, 2, 1),
                    new THREE.Face3(6, 7, 5),
                    new THREE.Face3(5, 4, 6),
                    new THREE.Face3(6, 8, 9),
                    new THREE.Face3(9, 7, 6),
                    new THREE.Face3(8, 0, 3),
                    new THREE.Face3(3, 9, 8)
                ];
            });


            it("with closing holes", function() {

                var plane = new THREE.Plane(
                    new THREE.Vector3(0, -1, 0).normalize(),
                    .5
                );
                var sliced = sliceGeometry(geometry, plane, true);
                var expected = new THREE.Geometry();
                expected.vertices = [
                    new THREE.Vector3(0.5, 0.5, 0),
                    new THREE.Vector3(0.375, 0.5, 0.375),
                    new THREE.Vector3(0.75, 0, 0.75),
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(0, 0.5, 0.5),
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(-0.375, 0.5, 0.375),
                    new THREE.Vector3(-0.75, 0, 0.75),
                    new THREE.Vector3(-0.5, 0.5, 0),
                    new THREE.Vector3(-1, 0, 0)
                ];
                expected.faces = [
                    new THREE.Face3(1, 2, 3),
                    new THREE.Face3(3, 0, 1),
                    new THREE.Face3(1, 4, 5),
                    new THREE.Face3(5, 2, 1),
                    new THREE.Face3(6, 7, 5),
                    new THREE.Face3(5, 4, 6),
                    new THREE.Face3(6, 8, 9),
                    new THREE.Face3(9, 7, 6),
                    new THREE.Face3(8, 0, 3),
                    new THREE.Face3(3, 9, 8),
                    new THREE.Face3(4, 1, 0),
                    new THREE.Face3(8, 6, 4),
                    new THREE.Face3(4, 0, 8)
                ];
                expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
            });
        });
    });

    describe("faces from edges", function() {

        it('joins edges into a sequence', function() {
            var edges = [
                [0,1],
                [1,2],
                [2,3],
                [3,0]
            ];
            var expected = [
                [3,0,1,2]
            ];
            var faces = facesFromEdges(edges);
            expect(faces).toEqual(expected);
        });

        it('copes with unordered edges', function() {
            var edges = [
                [0,1],
                [2,0],
                [3,2],
                [1,3]
            ];
            var expected = [
                [1,3,2,0]
            ];
            var faces = facesFromEdges(edges);
            expect(faces).toEqual(expected);
        });

        it('copes with isolated edges', function() {
            var edges = [
                [0,1],
                [8,9],
                [1,2],
                [2,3],
                [3,0]
            ];
            var expected = [
                [3,0,1,2]
            ];
            var faces = facesFromEdges(edges);
            expect(faces).toEqual(expected);
        });

        it('ignores incomplete faces', function() {
            var edges = [
                [0,1],
                [1,2],
                [2,3]
            ];
            var expected = [];
            var faces = facesFromEdges(edges);
            expect(faces).toEqual(expected);
        });

        it('copes with reversed edges', function() {
            var edges = [
                [1,0],
                [2,1],
                [2,3],
                [0,3]
            ];
            var expected = [
                [0,3,2,1]
            ];
            var faces = facesFromEdges(edges);
            expect(faces).toEqual(expected);
        });

        it('copes with multiple faces', function() {
            var edges = [
                [23,24],
                [24,22],
                [0,1],
                [8,9],
                [1,2],
                [2,3],
                [3,0],
                [9,10],
                [22,23],
                [10,11],
                [11,8]
            ];
            var expected = [
                [22,23,24],
                [3,0,1,2],
                [11,8,9,10]
            ];
            var faces = facesFromEdges(edges);
            expect(faces).toEqual(expected);
        });

        it('copes with gaps in indicies', function() {
            var edges = [
                [0,11],
                [11,22],
                [22,33],
                [33,0],
            ];
            var expected = [
                [33,0,11,22]
            ];
            var faces = facesFromEdges(edges);
            expect(faces).toEqual(expected);
        });
    });
});
