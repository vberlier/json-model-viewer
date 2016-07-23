/**
 *  @author Fizzy / https://github.com/fizzy81
 */


/**
 *  ModelViewer
 *****************************/

function ModelViewer(container) {


  // container

  this.container = container


  // element

  this.element = document.createElement('div')
  this.element.setAttribute('style', 'position: absolute; top: 0; bottom: 0; left: 0; right: 0; width: auto; height: auto; overflow: hidden;')

  this.container.appendChild(this.element)

  // get element dimensions
  var rect = this.element.getBoundingClientRect()


  // camera

  this.camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 1, 1000)
  this.camera.position.x = 16
  this.camera.position.y = 16
  this.camera.position.z = 32


  // scene

  this.scene = new THREE.Scene()


  // lights

  var light

  light = new THREE.AmbientLight(0xffffff, 0.97)
  this.scene.add(light)

  light = new THREE.DirectionalLight(0xffffff, 0.1)
  light.position.set(4, 10, 6)
  this.scene.add(light)


  // renderer

  this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  this.renderer.setSize(rect.width, rect.height)


  // controls

  this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
  this.controls.enableDamping = true
  this.controls.dampingFactor = 0.2
  this.controls.zoomSpeed = 1.4
  this.controls.rotateSpeed = 0.6
  this.controls.enableKeys = false


  // append viewer

  this.element.appendChild(this.renderer.domElement)


  // view methods

  var self = this


  // draw

  this.draw = function() {

    self.renderer.render(self.scene, self.camera)

  }


  // animate

  this.animate = function() {

    window.requestAnimationFrame(self.animate)
    self.controls.update()

    self.draw()

  }


  // resize

  this.resize = function() {

    var rect = self.element.getBoundingClientRect()

    self.camera.aspect = rect.width / rect.height
    self.camera.updateProjectionMatrix()

    self.renderer.setSize(rect.width, rect.height)

  }


  // models

  this.models = {}


  // model methods

  var self = this


  // load

  this.load = function(model) {

    var name = model.modelName

    if (Object.keys(self.models).indexOf(name) >= 0)
      throw new Error('Model "' + name + '" is already loaded.')

    self.scene.add(model)
    self.models[name] = model

    return self

  }


  // get

  this.get = function(name) {

    if (!(Object.keys(self.models).indexOf(name) >= 0))
      throw new Error('Model "' + name + '" is not loaded.')

    return self.models[name]

  }


  // getAll

  this.getAll = function() {

    return Object.keys(self.models).map(function(name) {return self.models[name]})

  }


  // remove

  this.remove = function(name) {

    if (!(Object.keys(self.models).indexOf(name) >= 0))
      throw new Error('Model "' + name + '" is not loaded.')

    delete self.models[name]

    for (var i = 0; i < self.scene.children.length; i++) {
      var child = self.scene.children[i]
      if (child instanceof JsonModel && child.modelName == name) {
        child.animationLoop = false
        self.scene.remove(child)
        break
      }
    }

    return self

  }


  // removeAll

  this.removeAll = function() {

    for (var i = self.scene.children.length - 1; i >= 0; i--) {
      var child = self.scene.children[i]
      if (child instanceof JsonModel) {
        child.animationLoop = false
        self.scene.remove(child)
      }
    }

    self.models = {}

    return self

  }


  // hide

  this.hide = function(name) {

    if (!(Object.keys(self.models).indexOf(name) >= 0))
      throw new Error('Model "' + name + '" is not loaded.')

    self.models[name].visible = false
    self.draw()

  }


  // hideAll

  this.hideAll = function() {

    Object.keys(self.models).forEach(function(name) {
      self.models[name].visible = false
    })

    return self

  }


  // show

  this.show = function(name) {

    if (!(Object.keys(self.models).indexOf(name) >= 0))
      throw new Error('Model "' + name + '" is not loaded.')

    self.models[name].visible = true
    self.draw()

  }


  // showAll

  this.showAll = function() {

    Object.keys(self.models).forEach(function(name) {
      self.models[name].visible = true
    })

    return self

  }


  // reset

  this.reset = function() {

    self.controls.reset()

  }


  // lookAt

  this.lookAt = function(name) {

    var model = self.get(name)
    self.controls.target = model.getCenter()


  }


  // create grid

  var gridGeometry = new THREE.Geometry()
  var gridMaterial = new THREE.LineBasicMaterial({color: 0xafafaf})

  for (var i = -8; i <= 8; i++) {

      gridGeometry.vertices.push(new THREE.Vector3(-8, -8, i))
      gridGeometry.vertices.push(new THREE.Vector3(8, -8, i))

      gridGeometry.vertices.push(new THREE.Vector3(i, -8, -8))
      gridGeometry.vertices.push(new THREE.Vector3(i, -8, 8))

  }

  // arrow

  gridGeometry.vertices.push(new THREE.Vector3(-1, -8, 9))
  gridGeometry.vertices.push(new THREE.Vector3(1, -8, 9))

  gridGeometry.vertices.push(new THREE.Vector3(1, -8, 9))
  gridGeometry.vertices.push(new THREE.Vector3(0, -8, 10))

  gridGeometry.vertices.push(new THREE.Vector3(0, -8, 10))
  gridGeometry.vertices.push(new THREE.Vector3(-1, -8, 9))

  var grid = new THREE.LineSegments(gridGeometry, gridMaterial)
  grid.visible = true

  this.scene.add(grid)
  this.grid = grid


  // grid methods

  var self = this


  // showGrid

  this.showGrid = function() {

    self.grid.visible = true

  }


  // hideGrid

  this.hideGrid = function() {

    self.grid.visible = false

  }


  // setGridColor

  this.setGridColor = function(color) {

    self.grid.material.color = new THREE.Color(color)

  }


  this.animate()


}



/**
 *  JsonModel
 *****************************/

function JsonModel(name, rawModel, texturesReference) {


  // parent constructor

  THREE.Object3D.call(this)


  // set modelName

  this.modelName = name


  // track animation

  this.animationLoop = true


  // parse model or throw an error if parsing fails

  try {
    var model = JSON.parse(rawModel)
  } catch (e) {
    throw new Error('Couldn\'t parse json model. ' + e.message + '.')
  }


  // get textures and handle animated textures

  var textures = {}
  var references = []

  var animated = []
  var animations = []

  if (model.hasOwnProperty('textures')) {

    Object.keys(model.textures).forEach(function(key, index) {

      // get texture reference value
      var temp = model.textures[key].split('/')
      var textureName = temp[temp.length - 1]

      // look for this value in the textures passed in parameter
      var reference
      for (var i = 0; i < texturesReference.length; i++) {
        reference = texturesReference[i]
        if (reference.name == textureName) {
          break
        }
      }

      // register the texture or throw an error if the name wasn't in the textures passed in parameter
      if (reference.name == textureName) {

        references.push(key)

        // handle animated textures
        if (reference.hasOwnProperty('mcmeta')) {

          // parse mcmeta
          try {
            var mcmeta = JSON.parse(reference.mcmeta)
          } catch (e) {
            throw new Error('Couldn\'t parse mcmeta for texture "' + textureName + '". ' + e.message + '.')
          }

          // check property
          if (!mcmeta.hasOwnProperty('animation'))
            throw new Error('Couldn\'t find the "animation" property in mcmeta for texture "' + textureName + '"')

          // image buffer to access width and height from dataURL
          var imageBuffer = new Image()
          imageBuffer.src = reference.texture

          var width = imageBuffer.width
          var height = imageBuffer.height

          // check if dimensions are valid
          if (height % width != 0)
            throw new Error('Image dimensions are invalid for texture "' + textureName + '".')

          // get frames from mcmeta or generate them
          var frames = []

          if (mcmeta.animation.hasOwnProperty('frames')) {
            frames = mcmeta.animation.frames
          } else {
            for (var k = 0; k < height/width; k++) {
              frames.push(k)
            }
          }

          // default value for frametime
          var frametime = mcmeta.animation.frametime || 1

          // uniform animation frames
          var animation = []

          for (var i = 0; i < frames.length; i++) {
            frame = frames[i]
            if (typeof frame == 'number') {
              animation.push({index: frame, time:frametime})
            } else {
              if (!frame.hasOwnProperty('index'))
                throw new Error('Invalid animation frame at index "' + i + '" in mcmeta for texture "' + textureName + '".')
              animation.push({index: frame.index, time: frame.time || frametime})
            }
          }

          // number of vertical frames
          var numberOfImages = height/width

          // register animation
          animations.push({height: numberOfImages, frames: animation, currentFrame: 0})
          animated.push(references.length - 1)

          // split frames
          var images = []

          for (var i = 0; i < height/width; i++) {

            // workspace
            var canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = width

            var ctx = canvas.getContext('2d')
            ctx.drawImage(imageBuffer, 0, -i*width)

            images.push(canvas.toDataURL('image/png'))

          }

          // register textures
          textures[key] = images

        } else {

          // register texture
          textures[key] = reference.texture

        }

      } else {

        throw new Error('Couldn\'t find matching texture for texture reference "' + textureName + '".')

      }

    })

  } else {

    throw new Error('Couldn\'t find "textures" property.')

  }


  // access this.animationLoop

  var self = this


  // generate material

  var materials = []

  // final material is made of several different materials, one for each texture
  references.forEach(function(ref, index) {

    // if animated texture, get the first frame
    var image = textures[ref] instanceof Array ? textures[ref][0] : textures[ref]

    // create three js texture from image
    var loader = new THREE.TextureLoader()
    var texture = loader.load(image)

    // sharp pixels and smooth edges
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.LinearFilter

    // map texture to material, keep transparency and fix transparent z-fighting
    var mat = new THREE.MeshLambertMaterial({map: texture, transparent: true, alphaTest: 0.5})

    materials.push(mat)

    // if animated texture
    if (textures[ref] instanceof Array) {

      // get texture array and animation frames
      var images = textures[ref]
      var animation = animations[animated.indexOf(index)]

      // keep scope
      ;(function(material, images, animation) {

        // recursively called with a setTimeout
        var animateTexture = function() {

          var frame = animation.frames[animation.currentFrame]

          // Prevent crashing with big animated textures
          try {
            material.map.image.src = images[frame.index]
            animation.currentFrame = animation.currentFrame < animation.frames.length - 1 ? animation.currentFrame + 1 : 0
          } catch (e) {
            console.log(e.message)
          }

          window.setTimeout(function() {
            if (self.animationLoop)
              window.requestAnimationFrame(animateTexture)
          }, frame.time*50) // multiplied by the length of a minecraft game tick (50ms)

        }

        // initialize recursion
        window.requestAnimationFrame(animateTexture)

      })(mat, images, animation)

    }

  })

  // extra transparent material for hidden faces
  var transparentMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, alphaTest: 0.5})

  materials.push(transparentMaterial)

  // big material list from all the other materials
  var material = new THREE.MeshFaceMaterial(materials)


  // create geometry

  // get elements or throw an error if the "elements" property can't be found

  var elements

  if (model.hasOwnProperty('elements')) {
    elements = model.elements
  } else {
    throw new Error('Couldn\'t find "elements" property')
  }


  // generate mesh

  var group = new THREE.Group()

  elements.forEach(function(element, index) {


    // check properties

    if (!element.hasOwnProperty('from'))
      throw new Error('Couldn\'t find "from" property for element "' + index + '".')
    if (!(element['from'].length == 3))
      throw new Error('"from" property for element "' + index + '" is invalid.')

    if (!element.hasOwnProperty('to'))
      throw new Error('Couldn\'t find "to" property for element "' + index + '".')
    if (!(element['to'].length == 3))
      throw new Error('"to" property for element "' + index + '" is invalid.')

    for (var i = 0; i < 3; i++) {
      var f = element['from'][i]
      var t = element['to'][i]
      if (typeof f != 'number' || f < -16)
        throw new Error('"from" property for element "' + index + '" is invalid (got "' + f + '" for coordinate "' + ['x', 'y', 'z'][i] + '").')
      if (typeof t != 'number' || t > 32)
        throw new Error('"to" property for element "' + index + '" is invalid (got "' + t + '" for coordinate "' + ['x', 'y', 'z'][i] + '").')
      if (t - f < 0)
        throw new Error('"from" property is bigger than "to" property for coordinate "' + ['x', 'y', 'z'][i] + '" in element "' + index + '".')
    }


    // get dimensions and origin

    var width = element['to'][0] - element['from'][0]
    var height = element['to'][1] - element['from'][1]
    var length = element['to'][2] - element['from'][2]

    var origin = {
      x: (element['to'][0] + element['from'][0]) / 2 - 8,
      y: (element['to'][1] + element['from'][1]) / 2 - 8,
      z: (element['to'][2] + element['from'][2]) / 2 - 8
    }


    // create geometry

    var fix = 0.001 // if a value happens to be 0, the geometry becomes a plane and will have 4 vertices instead of 12.

    var geometry = new THREE.BoxGeometry(width + fix, height + fix, length + fix)
    geometry.faceVertexUvs[0] = []


    // assign materials

    if (element.hasOwnProperty('faces')) {

      var faces = ['east', 'west', 'up', 'down', 'south', 'north']

      for (var i = 0; i < 6; i++) {

        var face = faces[i]

        if (element.faces.hasOwnProperty(face)) {


          // check properties

          if (!element.faces[face].hasOwnProperty('texture'))
            throw new Error('Couldn\'t find "texture" property for "' + face + '" face in element "' + index + '".')
          if (!element.faces[face].hasOwnProperty('uv'))
            throw new Error('Couldn\'t find "uv" property for "' + face + '" face in element "' + index + '".')
          if (element.faces[face].uv.length != 4)
            throw new Error('The "uv" property for "' + face + '" face in element "' + index + '" is invalid (got "' + element.faces[face].uv + '").')


          // get texture index

          var ref = element.faces[face].texture
          var textureIndex = references.indexOf(ref[0] == '#' ? ref.substring(1) : ref)


          // check if texture has been registered

          if (textureIndex < 0)
            throw new Error('The "texture" property for "' + face + '" face in element "' + index + '" is invalid (got "' + ref + '").')

          geometry.faces[i*2].materialIndex = textureIndex
          geometry.faces[i*2+1].materialIndex = textureIndex


          // uv map

          var uv = element.faces[face].uv


          // check

          uv.forEach(function(e, pos) {if (typeof e != 'number' || e + 0.00001 < 0 || e - 0.00001 > 16) throw new Error('The "uv" property for "' + face + '" face in element "' + index + '" is invalid (got "' + e + '" at index "' + pos + '").')})

          uv = uv.map(function(e) {return e/16})

          // fix edges
          uv[0] += 0.0005
          uv[1] += 0.0005
          uv[2] -= 0.0005
          uv[3] -= 0.0005

          var map = [
            new THREE.Vector2(uv[0], 1-uv[1]),
            new THREE.Vector2(uv[0], 1-uv[3]),
            new THREE.Vector2(uv[2], 1-uv[3]),
            new THREE.Vector2(uv[2], 1-uv[1])
          ]

          if (element.faces[face].hasOwnProperty('rotation')) {

            var amount = element.faces[face].rotation

            // check property

            if (!([0, 90, 180, 270].indexOf(amount) >= 0))
              throw new Error('The "rotation" property for "' + face + '" face in element "' + index + '" is invalid (got "' + amount + '").')

            // rotate map

            for (var j = 0; j < amount/90; j++) {
              map = [map[1], map[2], map[3], map[0]]
            }

          }

          geometry.faceVertexUvs[0][i*2] = [map[0], map[1], map[3]]
          geometry.faceVertexUvs[0][i*2+1] = [map[1], map[2], map[3]]


        } else {

          // transparent material

          geometry.faces[i*2].materialIndex = references.length
          geometry.faces[i*2+1].materialIndex = references.length

          var map = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1)
          ]

          geometry.faceVertexUvs[0][i*2] = [map[0], map[1], map[3]]
          geometry.faceVertexUvs[0][i*2+1] = [map[1], map[2], map[3]]

        }

      }

    }


    // create mesh

    var mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = origin.x
    mesh.position.y = origin.y
    mesh.position.z = origin.z


    // rotate if "rotation" property is defined

    if (element.hasOwnProperty('rotation')) {


      // check properties

      if (!element.rotation.hasOwnProperty('origin'))
        throw new Error('Couldn\'t find "origin" property in "rotation" for element "' + index + '".')
      if (!(element.rotation.origin.length == 3))
        throw new Error('"origin" property in "rotation" for element "' + index + '" is invalid.')

      if (!element.rotation.hasOwnProperty('axis'))
        throw new Error('Couldn\'t find "axis" property in "rotation" for element "' + index + '".')
      if (!((['x', 'y', 'z']).indexOf(element.rotation.axis) >= 0))
        throw new Error('"axis" property in "rotation" for element "' + index + '" is invalid.')

      if (!element.rotation.hasOwnProperty('angle'))
        throw new Error('Couldn\'t find "angle" property in "rotation" for element "' + index + '".')
      if (!(([45, 22.5, 0, -22.5, -45]).indexOf(element.rotation.angle) >= 0))
        throw new Error('"angle" property in "rotation" for element "' + index + '" is invalid.')


      // get origin, axis and angle

      var rotationOrigin = {
        x: element.rotation.origin[0] - 8,
        y: element.rotation.origin[1] - 8,
        z: element.rotation.origin[2] - 8
      }

      var axis = element.rotation.axis
      var angle = element.rotation.angle


      // create pivot

      var pivot = new THREE.Group()
      pivot.position.x = rotationOrigin.x
      pivot.position.y = rotationOrigin.y
      pivot.position.z = rotationOrigin.z

      pivot.add(mesh)


      // adjust mesh coordinates

      mesh.position.x -= rotationOrigin.x
      mesh.position.y -= rotationOrigin.y
      mesh.position.z -= rotationOrigin.z


      // rotate pivot

      if (axis == 'x')
        pivot.rotateX(angle * Math.PI/180)
      else if (axis == 'y')
        pivot.rotateY(angle * Math.PI/180)
      else if (axis == 'z')
        pivot.rotateZ(angle * Math.PI/180)


      // add pivot

      group.add(pivot)

    } else {

      var pivot = new THREE.Group()
      pivot.add(mesh)


      // add pivot

      group.add(pivot)

    }


  })


  // add group

  this.add(group)


  // register display options

  var keys = ['thirdperson_righthand', 'thirdperson_lefthand', 'firstperson_righthand', 'firstperson_lefthand', 'gui', 'head', 'ground', 'fixed']

  this.displayOptions = {}

  for (var i = 0; i < keys.length; i++) {
    this.displayOptions[keys[i]] = {rotation: [0, 0, 0], translation: [0, 0, 0], scale: [1, 1, 1]}
  }

  this.displayOptions.firstperson = this.displayOptions.firstperson_righthand
  this.displayOptions.thirdperson = this.displayOptions.thirdperson_righthand

  if (model.hasOwnProperty('display')) {

    var display = model.display

    for (var option in display) {
      if (this.displayOptions.hasOwnProperty(option)) {

        var fields = display[option]

        for (var name in fields) {
          if (this.displayOptions[option].hasOwnProperty(name)) {

            var field = fields[name]

            // check value
            if (field.length != 3 || typeof field[0] != 'number' || typeof field[1] != 'number' || typeof field[2] != 'number')
              throw new Error('"' + name + '" property is invalid for display option "' + option + '".')

            this.displayOptions[option][name] = field

          }
        }

      }
    }

  }


  // methods

  var self = this


  // getCenter

  this.getCenter = function() {

    var group = self.children[0]


    // compute absolute bounding box

    var box = {
      minx: 0, miny: 0, minz: 0,
      maxx: 0, maxy: 0, maxz: 0
    }

    for (var i = 0; i < group.children.length; i++) {

      var pivot = group.children[i]
      var mesh = pivot.children[0]

      for (var j = 0; j < mesh.geometry.vertices.length; j++) {

        // convert vertex coordinates to world coordinates

        var vertex = mesh.geometry.vertices[j].clone()
        var abs = mesh.localToWorld(vertex)

        // update bounding box

        if (abs.x < box.minx) box.minx = abs.x
        if (abs.y < box.miny) box.miny = abs.y
        if (abs.z < box.minz) box.minz = abs.z

        if (abs.x > box.maxx) box.maxx = abs.x
        if (abs.y > box.maxy) box.maxy = abs.y
        if (abs.z > box.maxz) box.maxz = abs.z

      }

    }

    // return the center of the bounding box

    return new THREE.Vector3(
      (box.minx + box.maxx) / 2,
      (box.miny + box.maxy) / 2,
      (box.minz + box.maxz) / 2
    )

  }


  // applyDisplay

  this.applyDisplay = function(option) {

    var group = self.children[0]

    if (option == 'block') {

      // reset transformations
      group.rotation.set(0, 0, 0)
      group.position.set(0, 0, 0)
      group.scale.set(1, 1, 1)

    } else {

      if (!self.displayOptions.hasOwnProperty(option))
        throw new Error('Display option is invalid.')

      var options = self.displayOptions[option]

      var rot = options.rotation
      var pos = options.translation
      var scale = options.scale

      // apply transformations
      group.rotation.set(rot[0] * Math.PI/180, rot[1] * Math.PI/180, rot[2] * Math.PI/180)
      group.position.set(pos[0], pos[1], pos[2])
      group.scale.set(scale[0] == 0 ? 0.00001 : scale[0], scale[1] == 0 ? 0.00001 : scale[1], scale[2] == 0 ? 0.00001 : scale[2])

    }

  }


}

JsonModel.prototype = Object.create(THREE.Object3D.prototype)
JsonModel.prototype.constructor = JsonModel
