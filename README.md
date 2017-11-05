# Three.js Slice Geometry

Slice three.js geometry with a plane.

## Usage

```javascript
var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
var geom = new THREE.BoxGeometry(1, 1, 1);
geom = sliceGeometry(geom, plane);
var material = new THREE.MeshBasicMaterial({ wireframe: true });
var mesh = new THREE.Mesh(geom, material);
scene.add(mesh);
```

## Builds

* http://tdhooper.github.io/threejs-slice-geometry/build/slice.js
* http://tdhooper.github.io/threejs-slice-geometry/build/slice.min.js


## Examples

https://tdhooper.github.io/threejs-slice-geometry/examples
