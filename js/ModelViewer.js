
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
  this.controls.enablePan = false

  this.element.appendChild(this.renderer.domElement)


  this.draw()


}
