

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


  // models

  this.models = {}


  // model methods

  var self = this


  // loadModel

  this.loadModel = function(model) {

    var name = model.modelName

    if (Object.keys(self.models).indexOf(name) >= 0)
      throw 'Model "' + name + '" is already loaded.'

    self.scene.add(model)
    self.models[name] = model

    return self

  }


  // getModel

  this.getModel = function(name) {

    if (!(Object.keys(self.models).indexOf(name) >= 0))
      throw 'Model "' + name + '" is not loaded.'

    return self.models[name]

  }


  // getAll

  this.getAll = function() {

    return Object.keys(self.models).map(function(name) {return self.models[name]})

  }


  // remove

  this.remove = function(name) {

    if (!(Object.keys(self.models).indexOf(name) >= 0))
      throw 'Model "' + name + '" is not loaded.'

    delete self.models[name]

    for (var i = 0; i < self.scene.children.length; i++) {
      var child = self.scene.children[i]
      if (child instanceof JsonModel && child.modelName == name) {
        self.scene.remove(child)
        break
      }
    }

    return self

  }


  // removeAll

  this.removeAll = function() {

    for (var i = 0; i < self.scene.children.length; i++) {
      var child = self.scene.children[i]
      if (child instanceof JsonModel) {
        self.scene.remove(child)
      }
    }

    self.models = {}

    return self

  }


  // hide

  this.hide = function(name) {

    if (!(Object.keys(self.models).indexOf(name) >= 0))
      throw 'Model "' + name + '" is not loaded.'

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
      throw 'Model "' + name + '" is not loaded.'

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


  // parse model or throw an error if parsing fails

  try {
    var model = JSON.parse(rawModel)
  } catch (e) {
    throw 'Couldn\'t parse json model. ' + e.message + '.'
  }


  // get textures or throw an error if the "textures" property can't be found

  var textures = {}
  var references = []

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
        references.push(key)
      } else {
        throw 'Couldn\'t find matching texture for texture reference "' + textureName + '".'
      }

    })

  } else {

    throw 'Couldn\'t find "textures" property.'

  }


  // generate material

  var materials = []

  references.forEach(function(ref, index) {
    var loader = new THREE.TextureLoader()
    var texture = loader.load(textures[ref])
    texture.magFilter = THREE.NearestFilter
    materials.push(new THREE.MeshLambertMaterial({map: texture, transparent: true}))
  })

  var transparentMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0})

  materials.push(transparentMaterial)

  var material = new THREE.MeshFaceMaterial(materials)



  // get elements or throw an error if the "elements" property can't be found

  var elements

  if (model.hasOwnProperty('elements')) {
    elements = model.elements
  } else {
    throw 'Couldn\'t find "elements" property'
  }


  // generate mesh

  var group = new THREE.Group()

  elements.forEach(function(element, index) {


    // check properties

    if (!element.hasOwnProperty('from'))
      throw 'Couldn\'t find "from" property for element "' + index + '".'
    if (!(element['from'].length == 3))
      throw '"from" property for element "' + index + '" is invalid.'

    if (!element.hasOwnProperty('to'))
      throw 'Couldn\'t find "to" property for element "' + index + '".'
    if (!(element['to'].length == 3))
      throw '"to" property for element "' + index + '" is invalid.'

    for (var i = 0; i < 3; i++) {
      var f = element['from'][i]
      var t = element['to'][i]
      if (typeof f != 'number' || f < -16)
        throw '"from" property for element "' + index + '" is invalid (got "' + f + '" for coordinate "' + ['x', 'y', 'z'][i] + '").'
      if (typeof t != 'number' || t > 32)
        throw '"to" property for element "' + index + '" is invalid (got "' + t + '" for coordinate "' + ['x', 'y', 'z'][i] + '").'
      if (t - f < 0)
        throw '"from" property is bigger than "to" property for coordinate "' + ['x', 'y', 'z'][i] + '" in element "' + index + '".'
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

    var fix = 0.001 // if a value happens to be 0, the geometry becomes a plane and has 4 vertices instead of 12.

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
            throw 'Couldn\'t find "texture" property in for "' + face + '" face in element "' + index + '".'
          if (!element.faces[face].hasOwnProperty('uv'))
            throw 'Couldn\'t find "uv" property in for "' + face + '" face in element "' + index + '".'
          if (element.faces[face].uv.length != 4)
            throw 'The "uv" property in for "' + face + '" face in element "' + index + '" is invalid (got "' + element.faces[face].uv + '").'


          // get texture index

          var ref = element.faces[face].texture
          var textureIndex = references.indexOf(ref.startsWith('#') ? ref.substring(1) : ref)


          // check if texture has been registered

          if (textureIndex < 0)
            throw 'The "texture" property in for "' + face + '" face in element "' + index + '" is invalid (got "' + ref + '").'

          geometry.faces[i*2].materialIndex = textureIndex
          geometry.faces[i*2+1].materialIndex = textureIndex


          // uv map

          var uv = element.faces[face].uv


          // check

          uv.forEach(function(e, pos) {if (typeof e != 'number' || e < 0 || e > 16) throw 'The "uv" property in for "' + face + '" face in element "' + index + '" is invalid (got "' + e + '" at index "' + pos + '").'})

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
              throw 'The "rotation" property in for "' + face + '" face in element "' + index + '" is invalid (got "' + amount + '").'

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
        throw 'Couldn\'t find "origin" property in "rotation" for element "' + index + '".'
      if (!(element.rotation.origin.length == 3))
        throw '"origin" property in "rotation" for element "' + index + '" is invalid.'

      if (!element.rotation.hasOwnProperty('axis'))
        throw 'Couldn\'t find "axis" property in "rotation" for element "' + index + '".'
      if (!((['x', 'y', 'z']).indexOf(element.rotation.axis) >= 0))
        throw '"axis" property in "rotation" for element "' + index + '" is invalid.'

      if (!element.rotation.hasOwnProperty('angle'))
        throw 'Couldn\'t find "angle" property in "rotation" for element "' + index + '".'
      if (!(([45, 22.5, 0, -22.5, -45]).indexOf(element.rotation.angle) >= 0))
        throw '"angle" property in "rotation" for element "' + index + '" is invalid.'


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


}

JsonModel.prototype = Object.create(THREE.Object3D.prototype)
JsonModel.prototype.constructor = JsonModel
