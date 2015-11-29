# Three.js Slice Geometry

Slice a three.js geometry with a plane

## Usage

Include http://tdhooper.github.io/threejs-slice-geometry/src/slice.js

```javascript
var geom = new THREE.BoxGeometry(1, 1, 1);
geom = sliceGeometry(geom, plane);
scene.add( new THREE.Mesh( geom, material ) );
```

## Examples

http://codepen.io/tdhooper/pen/epqNgN
