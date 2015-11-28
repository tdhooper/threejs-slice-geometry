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

    var faceVerticesAndNormals = function(geom) {
        var geomCopy = geom.clone();
        var vertices;
        geomCopy.computeFaceNormals();
        var compareArray = function(a, b) {
            for (var i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return a[i] - b[i];
                }
            }
            return 0;
        };
        return geomCopy.faces.map(function(face) {
            vertices = ['a', 'b', 'c'].map(function(key) {
                return geomCopy.vertices[face[key]].toArray();
            }).sort(compareArray);
            return {
                vertices: vertices,
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

            geometry.faces = [
                new THREE.Face3(0, 1, 2)
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

        it("sliced with whole geometry behind and touching plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(-1, 0, 0),
                0
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices.length).toBe(0);
            expect(sliced.faces.length).toBe(0);
        });

        it("sliced with whole geometry in front of and touching plane", function() {
            var plane = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                0
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices).toEqual(geometry.vertices);
            expect(sliced.faces).toEqual(geometry.faces);
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
            expected.faces = [
                new THREE.Face3(0, 1, 2)
            ];
            expect(faceVerticesAndNormals(sliced)).toEqual(faceVerticesAndNormals(expected));
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

            geometry.faces = [
                new THREE.Face3(0, 1, 2),
                new THREE.Face3(3, 2, 1)
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
            expected.faces = [
                new THREE.Face3(0, 1, 2)
            ];
            expect(faceVerticesAndNormals(sliced)).objectToBeCloseTo(faceVerticesAndNormals(expected), 2);
        });
    });
});
