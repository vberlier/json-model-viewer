

var degres = Math.PI / 180


/**
 *  Exceptions
 *****************************/

function ModelGenerationError(message) {
  this.name = 'ModelGenerationError'
  this.message = message || "Couldn't generate model."
  this.stack = (new Error()).stack
}
ModelGenerationError.prototype = Object.create(Error.prototype)
ModelGenerationError.prototype.constructor = ModelGenerationError

function ModelLoadingError(message) {
 this.name = 'ModelLoadingError'
 this.message = message || "Couldn't load model."
 this.stack = (new Error()).stack
}
ModelLoadingError.prototype = Object.create(Error.prototype)
ModelLoadingError.prototype.constructor = ModelLoadingError



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

  light = new THREE.DirectionalLight(0x232323)
  light.position.set(8, 10, 9)
  this.scene.add(light)

  light = new THREE.DirectionalLight(0x161616)
  light.position.set(-8, -7, -9)
  this.scene.add(light)


  light = new THREE.AmbientLight(0xe6e6e6)
  this.scene.add(light)


  // methods

  var self = this


  // animate

  this.animate = function() {

    requestAnimationFrame(self.animate)
    self.controls.update()

  }


  // draw

  this.draw = function() {
    self.renderer.render(self.scene, self.camera)
  }


  // resize

  this.resize = function() {

    var rect = self.element.getBoundingClientRect()

    self.camera.aspect = rect.width / rect.height
    self.camera.updateProjectionMatrix()

    self.renderer.setSize(rect.width, rect.height)

    self.draw()

  }


  // renderer

  this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  this.renderer.setSize(rect.width, rect.height)


  // controls

  this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
  this.controls.addEventListener('change', this.draw)

  this.element.appendChild(this.renderer.domElement)


  this.draw()


  // models

  this.models = {}


  // model methods

  var self = this


  // loadModel

  this.loadModel = function(name, model) {

    if (Object.keys(self.models).indexOf(name) >= 0)
      throw new ModelLoadingError('Model "' + name + '" is already loaded.')

    self.models[name] = model
    self.scene.add(model)

    self.draw()

  }


}



/**
 *  JsonModel
 *****************************/

function JsonModel(rawModel, texturesReference) {


  // parent constructor

  THREE.Object3D.call(this)


  // parse model or throw an error if parsing fails

  try {
    var model = JSON.parse(rawModel)
  } catch (e) {
    throw new ModelGenerationError('Couldn\'t parse json model. ' + e.message + '.')
  }


  // get textures or throw an error if the "textures" property can't be found

  var textures = {}

  if (model.hasOwnProperty('textures')) {

    Object.keys(model.textures).forEach(function(key, index) {

      // get texture reference value
      var temp = model.textures[key].split('/')
      var textureName = temp[temp.length - 1]

      // look for this value in the textures passed in parameter
      var texture
      for (var i = 0; i < texturesReference.length; i++) {
        reference = texturesReference[i]
        if (reference.name == textureName) {
          break
        }
      }

      // register the texture or throw an error if the name wasn't in the textures passed in parameter
      if (reference.name == textureName) {
        textures[key] = reference.texture
      } else {
        throw new ModelGenerationError('Couldn\'t find matching texture for texture reference "' + textureName + '".')
      }

    })

  } else {

    throw new ModelGenerationError('Couldn\'t find "textures" property.')

  }


  // get elements or throw an error if the "elements" property can't be found

  var elements

  if (model.hasOwnProperty('elements')) {
    elements = model.elements
  } else {
    throw new ModelGenerationError('Couldn\'t find "elements" property')
  }


  // generate mesh

  var group = new THREE.Group()

  elements.forEach(function(element, index) {


    // check properties

    if (!element.hasOwnProperty('from'))
      throw new ModelGenerationError('Couldn\'t find "from" property for element "' + index + '".')
    if (!(element['from'].length == 3))
      throw new ModelGenerationError('"from" property for element "' + index + '" is invalid.')

    if (!element.hasOwnProperty('to'))
      throw new ModelGenerationError('Couldn\'t find "to" property for element "' + index + '".')
    if (!(element['to'].length == 3))
      throw new ModelGenerationError('"to" property for element "' + index + '" is invalid.')

    for (var i = 0; i < 3; i++) {
      var f = element['from'][i]
      var t = element['to'][i]
      if (t - f < 0)
        throw new ModelGenerationError('"from" property is bigger than "to" property for coordinate "' + ['x', 'y', 'z'][i] + '" in element "' + index + '".')
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


    // create mesh

    var geometry = new THREE.BoxGeometry(width, height, length)

    var mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 0x55a6e8}))
    mesh.position.x = origin.x
    mesh.position.y = origin.y
    mesh.position.z = origin.z


    // rotate if "rotation" property is defined

    if (element.hasOwnProperty('rotation')) {


      // check properties

      if (!element.rotation.hasOwnProperty('origin'))
        throw new ModelGenerationError('Couldn\'t find "origin" property in "rotation" for element "' + index + '".')
      if (!(element.rotation.origin.length == 3))
        throw new ModelGenerationError('"origin" property in "rotation" for element "' + index + '" is invalid.')

      if (!element.rotation.hasOwnProperty('axis'))
        throw new ModelGenerationError('Couldn\'t find "axis" property in "rotation" for element "' + index + '".')
      if (!((['x', 'y', 'z']).indexOf(element.rotation.axis) >= 0))
        throw new ModelGenerationError('"axis" property in "rotation" for element "' + index + '" is invalid.')

      if (!element.rotation.hasOwnProperty('angle'))
        throw new ModelGenerationError('Couldn\'t find "angle" property in "rotation" for element "' + index + '".')
      if (!(([45, 22.5, 0, -22.5, -45]).indexOf(element.rotation.angle) >= 0))
        throw new ModelGenerationError('"angle" property in "rotation" for element "' + index + '" is invalid.')


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
        pivot.rotateX(angle * degres)
      else if (axis == 'y')
        pivot.rotateY(angle * degres)
      else if (axis == 'z')
        pivot.rotateZ(angle * degres)


      // add pivot

      group.add(pivot)

    } else {


      // add mesh

      group.add(mesh)

    }


  })


  // add group

  this.add(group)


}

JsonModel.prototype = Object.create(THREE.Object3D.prototype)
JsonModel.prototype.constructor = JsonModel
