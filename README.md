# Three.js Slice Geometry

Slice three.js geometry with a plane.

## Usage

```javascript
var geom = new THREE.BoxGeometry(1, 1, 1);
geom = sliceGeometry(geom, plane);
scene.add( new THREE.Mesh( geom, material ) );
```

## Builds

* http://tdhooper.github.io/threejs-slice-geometry/build/slice.0.1.0.js
* http://tdhooper.github.io/threejs-slice-geometry/build/slice.0.1.0.min.js


## Examples

http://codepen.io/tdhooper/pen/epqNgN
