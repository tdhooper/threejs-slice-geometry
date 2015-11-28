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
                -0.5
            );
            var sliced = sliceGeometry(geometry, plane);
            expect(sliced.vertices.length).toBe(3);
            expect(faceVertices(sliced)).toEqual([
                [
                    new THREE.Vector3(1, 1, 0),
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(1, 0, 0)
                ]
            ]);
        });
    });
});
