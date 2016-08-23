# json-model-viewer

A 3d model viewer for minecraft json models. Requires [three.js](https://github.com/mrdoob/three.js/) and [OrbitControls](https://github.com/mrdoob/three.js/blob/master/examples/js/controls/OrbitControls.js).

## Basic usage

```javascript

var viewer = new ModelViewer(document.body)

window.addEventListener('resize', viewer.resize)

// "json", "textureName" and "dataURL" must be provided from somewhere else
var model = new JsonModel('myModel', json, [{name: textureName, texture: dataURL}])

viewer.load(model)
```

### ModelViewer(element)

Use `new ModelViewer(element)` to create a new viewer. `element` must be a DOM element and will be used to hold the viewer. The size of the element will determine the size of the viewer.

#### Methods

Method                 | Description
---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------
`.load(model)`         | Loads a model in the viewer. `model` must be a `JsonModel` object.
`.get(name)`           | Returns the model with the name `name`.
`.getAll()`            | Returns an Array with all the loaded models.
`.remove(name)`        | Removes the model with the name `name`.
`.removeAll()`         | Removes all the loaded models.
`.hide(name)`          | Sets the `visible` property to `false` for the model with the name `name`.
`.hideAll()`           | Sets the `visible` property to `false` for all the loaded models.
`.show(name)`          | Sets the `visible` property to `true` for the model with the name `name`.
`.showAll()`           | Sets the `visible` property to `true` for all the loaded models.
`.lookAt(name)`        | Moves the camera toward the model with the name `name`.
`.showGrid()`          | Displays the floor grid.
`.hideGrid()`          | Hides the floor grid.
`.setGridColor(color)` | Sets the grid color. `color` must be a number, usually written in hexadecimal (i.e. red: `0xff0000`).
`.resize()`            | Updates the size and the aspect ratio of the viewer. Usualy bound to the `resize` event of the `window` if the viewer takes the whole page.
`.reset()`             | Resets the camera.

### JsonModel(name, json, textures, clipUVs)

Use `new JsonModel(name, json, textures)` to create a group of [three.js meshs](http://threejs.org/docs/index.html#Reference/Objects/Mesh) from any minecraft json model. `name` must be a unique identifier and `json` a JSON string that contains a minecraft json model. `textures` must be an Array formatted as followed:

```javascript
[{name: 'texture1', texture: dataURL1}, {name: 'texture2', texture: dataURL2}, ...]
```

All textures referenced in the json model must be passed in parameter with the correct name.

For instance, if the `textures` property of a model looks like this:

```javascript
{
    "textures": {
        "0": "blocks/dirt",
        "1": "blocks/stone"
    },
    "elements": [
        ...
    ]
}
```

The `textures` Array will contain two textures, the `dirt` texture and the `stone` texture:

```javascript
var textures = [
  {name: 'dirt', texture: dirtTextureDataURL},
  {name: 'stone', texture: stoneTextureDataURL}
]
var model = new JsonModel('myModel', json, textures)
```

The `name` property must match the texture's file name, regardless of the folder in which it is. This means that `folderA/myTexture` and `folderB/myTexture` will both use the texture named `myTexture`, even if the original textures are not the same.

The `texture` property must be the image dataURL of the corresponding texture.

The constructor can also take an optional argument. `clipUVs` is set to true by default, and will clip invalid uvs on the fly. If set to false, the constructor will throw an error if it encounters uv coordinates outside of the valid 0-16 range.

#### Animated textures

If the texture is an animated texture, the .mcmeta file must be provided as well. For instance, if a model has only one animated texture, the `textures` Array will look like this:

```javascript
var textures = [{name: 'animatedTexture', texture: textureDataURL, mcmeta: textureMcmeta}]
```

The `mcmeta` property must be a JSON string that contains the content of the mcmeta file of the texture.

Note that the viewer doesn't support frame interpolation.

#### Methods

`JsonModel` objects inherit from `THREE.Object3D`, see the [three.js documentation](http://threejs.org/docs/index.html#Reference/Core/Object3D) for more information.

Method                  | Description
----------------------- | -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
`.getCenter()`          | Returns the center of the model's bounding box as a `THREE.Vector3` object.
`.applyDisplay(option)` | Applies a transformation specified in the `display` section of the model. The `option` parameter can be `thirdperson_righthand` or `thirdperson`, `thirdperson_lefthand`, `firstperson_righthand` or `firstperson`, `firstperson_lefthand`, `gui`, `head`, `ground`, `fixed` and `block`.
