console.clear()



// =======================================================
// UI ====================================================
// =======================================================
let C = {
  play: true,
  numBalls: 15,
  angleIncrement: 0.05,
  startPeriod: 4,
  endPeriod: 3,
  ballSize: 10,
  ballAlpha: 1,
  waveColor: {r:0, g:223, b:252},
  blipFadeTime: 200,
  colorEffect: false,
  sizeEffect: false,
  ballLinesEnabled: true,
  sideLinesEnabled: true,
  root: 48,
  scalePreset: 'minor pentatonic',
  scale: '0 3 5 7 10',
  noteDuration: 100,
  velocity: 80,
  midiOutputPort: '',
  bothSidesTrigger: true,
  pEnabled: true,
  pLifeTime: 30,
  pStartSize: 20,
  pEndSize: 40,
  pLeftColor: { r: 255, g: 146, b: 86 },
  pRightColor: { r: 255, g: 106, b: 123 },
  pStartAlpha: 255,
  synthEnabled: true,
  releaseTime: 0.2,
  volume: -12,
  backgroundColor: {r:30, g:30, b:30}
}

let scaleMenu = {
  'major chord': '0 4 7',
  'minor chord': '0 3 7',
  'major 7 chord': '0 4 7 11',
  'minor 7 chord': '0 3 7 10',
  'dom 7 chord': '0 4 7 10',
  'major scale': '0 2 4 5 7 9 11',
  'minor scale': '0 2 3 5 7 8 10',
  'major pentatonic': '0 2 4 7 9',
  'minor pentatonic': '0 3 5 7 10'
}

let gui = new dat.GUI()

let waveControls = gui.addFolder('Wave Controls')
waveControls.open()
waveControls.add(C, 'play')
waveControls.add({ fun: function() {
  wave.init()
}}, 'fun').name('reset')
waveControls.add(C, 'numBalls').name('number of balls').onChange(initWave)
waveControls.add(C, 'startPeriod').name('high period').onChange(setVelocities)
waveControls.add(C, 'endPeriod').name('low period').onChange(setVelocities)

let waveVisualControls = gui.addFolder('Wave Style')
// waveVisualControls.open()
waveVisualControls.add(C, 'ballSize', 1, 1000, 1).name('ball size')
waveVisualControls.add(C, 'ballAlpha', 0, 1, 0.01).name('ball alpha')
waveVisualControls.add(C, 'ballLinesEnabled').name('show inner lines')
waveVisualControls.add(C, 'sideLinesEnabled').name('show side lines')
waveVisualControls.addColor(C, 'waveColor').name('wave color')
waveVisualControls.addColor(C, 'backgroundColor').name('background color')

let noteControls = gui.addFolder('Notes')
noteControls.open()
noteControls.add(C, 'bothSidesTrigger').name('both sides trigger')
noteControls.add(C, 'root', 1, 127, 1).onFinishChange(setMidiNotes)

noteControls.add(C, 'scale').onFinishChange(setMidiNotes).listen()  // listen() updates UI if we change C.scale within code
noteControls.add(C, 'scalePreset', scaleMenu).onFinishChange(scaleMenuSelected)



let particleControls = gui.addFolder('Particles')
particleControls.add(C, 'pEnabled').name('enabled')
particleControls.add(C, 'pLifeTime').name('lifetime')
particleControls.add(C, 'pStartSize').name('start size')
particleControls.add(C, 'pEndSize').name('end size')
particleControls.addColor(C, 'pLeftColor').name('left color')
particleControls.addColor(C, 'pRightColor').name('right color')
particleControls.add(C, 'pStartAlpha', 0, 255, 1).name('starting alpha')


let midiControls = gui.addFolder('MIDI')
// midiControls.open()
let portController = midiControls.add(C, 'midiOutputPort').name('port').onChange(setMidiPort)
midiControls.add(C, 'noteDuration').name('note length (ms)')
midiControls.add(C, 'velocity', 1, 127, 1)


let synthControls = gui.addFolder('Synth')
synthControls.open()
synthControls.add(C, 'synthEnabled').name('enabled').onChange(startToneAudio)
synthControls.add(C, 'releaseTime').name('release time')
synthControls.add(C, 'volume', -36, 0, 1).name('volume (dB)').onChange(setSynthVolume)



// let effectControls = gui.addFolder('Other Effects')
// effectControls.open()
// effectControls.addColor(C, 'backgroundColor').name('background color')

// effectControls.add(C, 'colorEffect').name('color blip/fade')
// effectControls.add(C, 'sizeEffect').name('size blip/fade')
// effectControls.add(C, 'blipFadeTime').name('blip/fade length')

// waveControls.add(C, 'baseFrequency', 0, .2).name('base frequency').onChange(setVelocities)
// waveControls.add(C, 'frequencyOffset').name('frequency offset').onChange(setVelocities)


// ================================================================
// Ball Class =====================================================
// ================================================================
class Ball {
  constructor() {
    this.x = 0
    this.y = 0
    
    this.angle = 0
    this.angleVelocity = 0.05
    
    this.id = 0
    this.state = 'rising'
    
    this.defaultColor = color(255)
    this.timer = new Timer(C.blipFadeTime)
    this.leftColor = color(255, 0, 0)
    this.rightColor = color(0, 255, 255)
    this.triggerColor = this.defaultColor
  }
  
  update() {
    if (C.play) {
      this.angle += this.angleVelocity
    }
  }
  
  checkTrigger() {
    let note = midiNotes[midiNotes.length - 1 - this.id]
    let velocity = floor(C.velocity * 127)

    // RIGHT SIDE ============================
    if (this.state === 'rising') {
      if (this.x > waveWidth - 1) {
        
        if (C.bothSidesTrigger) {     
          // play midi
          if (note >= 0 && note <= 127 && midiOutput) {
            midiOutput.playNote(note, 1, {duration: C.noteDuration, velocity: velocity})
          }
          
          // play synth
          if (C.synthEnabled) {
            let toneNote = Tone.Frequency(note, 'midi')
            synthRight.triggerAttackRelease(toneNote, C.releaseTime)
          }
          
          // triggerFade('right')
          this.triggerColor = this.rightColor
          this.timer.start()
          
          if (C.pEnabled) {
            particles.push(new Particle(this.x, this.y, 'right'))
          }
        }
        
        this.state = 'falling'
      }
    }
    
    // LEFT SIDE ============================
    if (this.state === 'falling') {
      if (this.x < -waveWidth + 1) {
        // play midi
        if (note >= 0 && note <= 127 && midiOutput) {
          midiOutput.playNote(note, 2, {duration: C.noteDuration, velocity: velocity})
        }

        // play synth
        if (C.synthEnabled) {
          let toneNote = Tone.Frequency(note, 'midi')
          synthLeft.triggerAttackRelease(toneNote, C.releaseTime)
        }
        
        
        // triggerFade('left')
        this.triggerColor = this.leftColor
        this.timer.start()
        
        if (C.pEnabled) {
          particles.push(new Particle(this.x, this.y, 'left'))
        }
        
        this.state = 'rising'
      }
    }
  }
  
  draw() {
    let r, g, b
    ({r, g, b} = C.waveColor)
    this.defaultColor = color(r, g, b)
    
    let normalized = 1 - this.timer.currentTime / this.timer.duration
    // normalized = 1

    let drawSize
    if (C.sizeEffect) {
      drawSize = lerp(C.ballSize, C.ballSize + 20, normalized)
    }
    else {
      drawSize = C.ballSize
    }
    
    let drawColor 
    if (C.colorEffect) {
      
      drawColor = lerpColor(this.defaultColor, this.triggerColor, normalized)
    }
    else {
      drawColor = this.defaultColor
    }
    
    if (C.ballLinesEnabled) {
      let r, g, b
      ({r, g, b} = C.waveColor)
      stroke(color(r, g, b), 150)
      line(0, this.y, this.x, this.y)
    }
    
    noStroke()
    drawColor.setAlpha(C.ballAlpha * 255)
    fill(drawColor)

    // let x = sin(this.angle)
    // this.x = map(x, -1, 1, -waveWidth, waveWidth)
    
    circle(this.x, this.y, drawSize)
  }
}

// =========================================================
// Wave Class ==============================================
// =========================================================
class Wave {
  constructor({numBalls = C.numBalls} = {}) {
    this.numBalls = numBalls
    this.balls = []
    
    this.init()
  }
  
  init() {
    this.balls = Array.from(Array(this.numBalls), (_, i) => {
      let ball = new Ball()
      
      ball.id = i
      ball.y = map(i, 0, this.numBalls-1, -waveHeight, waveHeight)
      
      // ball.angleVelocity = random(-0.1, 0.1)
      ball.angle = 0
      // ball.angleVelocity = C.baseFrequency + (i / C.frequencyOffset)
      
      
      return ball
    })
    
    this.setVelocities()
  }
  
  reset() {
    this.balls.forEach(ball => ball.angle = 0)
  }
  
  setVelocities() {
    let startAngleV = TWO_PI_OVER_60 / C.startPeriod
    let endAngleV = TWO_PI_OVER_60 / C.endPeriod
  
    this.balls.forEach((ball,i) => {
      // ball.angleVelocity = C.baseFrequency + (i / C.frequencyOffset)   // old version

      ball.angleVelocity = map(i, 0, this.balls.length-1, startAngleV, endAngleV)
    })
  }
  
  render() {
    this.balls.forEach(ball => {
      if (C.play) {
        
        let x = sin(ball.angle)
        ball.x = map(x, -1, 1, -waveWidth, waveWidth)
        
        ball.angle += ball.angleVelocity
      }
      
      ball.checkTrigger()
      ball.draw()
    })
  }
}

// ================================================
// p5 =============================================
// ================================================

let wave
let waveWidth
let waveHeight
const TWO_PI_OVER_60 = 2 * Math.PI / 60

let midiOutput
let midiNotes = []

let particles = []

let panVolLeft, panVolRight
let synthLeft, synthRight

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight)
  cnv.style('display', 'block')
  
  waveWidth = 300
  waveHeight = 300
  
  setMidiNotes()
  
  setupSynths()
  
  wave = new Wave()
}

function draw() {
  let r, g, b
  ({r, g, b} = C.backgroundColor)
  background(color(r, g, b))
  
  translate(width/2, height/2)
  
  // draw side lines
  if (C.sideLinesEnabled) {
    stroke(255)
    line(-waveWidth, -waveHeight, -waveWidth, waveHeight)
    line(waveWidth, -waveHeight, waveWidth, waveHeight)
  }
  
  // wave
  wave.render()
    
  // particles
  particles = particles.filter(p => p.isAlive())

  particles.forEach(p => {
    p.update()
    p.draw()
  })  
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
}

function mousePressed() {
  
}

// =======================================================
// =======================================================
// =======================================================
function initWave() {
  wave = new Wave({numBalls: C.numBalls})
  setMidiNotes()
}

function setMidiNotes() {
  // convert UI string of intervals to array of numbers
  let scaleIntervals = C.scale.split(' ').map(str => Number(str))
  
  midiNotes = []
  for (let i = 0; i < C.numBalls; i++) {
    let octave = floor(i / scaleIntervals.length)
    
    midiNotes[i] = C.root + scaleIntervals[i % scaleIntervals.length] + (octave * 12)
  }
}

function scaleMenuSelected() {
  console.log(C.scalePreset)

  C.scale = C.scalePreset
  setMidiNotes()
}

function setMidiPort() {
  console.log('hello')
  midiOutput = WebMidi.getOutputByName(C.midiOutputPort)
  console.log("WebMidi connected.", midiOutput.name)
}

function setVelocities() {
  wave.setVelocities()
}

function startToneAudio() {
  // console.log('tone started')
  Tone.start()
}

function setSynthVolume() {
  panVolLeft.volume.value = C.volume
  panVolRight.volume.value = C.volume
}

function setupSynths() {
  Tone.start()
  
  panVolLeft = new Tone.PanVol(-1, C.volume).toDestination()
  panVolRight = new Tone.PanVol(1,  C.volume).toDestination()
  
  synthLeft = new Tone.PolySynth(Tone.Synth).connect(panVolLeft)
  synthRight = new Tone.PolySynth(Tone.Synth).connect(panVolRight)
  
  
  synthLeft.set({
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.001
    }
  })
  
  synthRight.set({
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.001
    }
  })
}

// =======================================================
// WebMidi ===============================================
// =======================================================
WebMidi.enable(err => {
  if (err) {
    console.log("WebMidi could not be enabled.", err)
  }
  else {
    let outputNames = [...WebMidi.outputs].map(output => output.name)  // copy ports array and turn it their names
    portController.options(outputNames).setValue(outputNames[0]).name('port').onChange(setMidiPort)
    midiOutput = WebMidi.outputs[0] 
    if (midiOutput) {
      console.log(`WebMidi connected to ${midiOutput.name}`, midiOutput.name)
    } else {
      console.log("No midi outputs found.")
    }
  }
})

// ==========================================================
// Particle  ================================================
// ==========================================================
class Particle {
  constructor(x, y, side) {
    this.pos = createVector(x, y)
    
    let r, g, b
    if (side === 'left') {
      ({r, g, b} = C.pLeftColor)
    }
    else if (side === 'right') {
      ({r, g, b} = C.pRightColor)
    }
    this.color = color(r, g, b)
    
    this.startSize = C.pStartSize
    this.endSize = C.pEndSize
    
    this.startAlpha = C.pStartAlpha
    
    this.isDead = false
    this.lifeTime = C.pLifeTime
    this.life = this.lifeTime
  }
  
  isAlive() {
    return this.life > 0
  }
  
  update() {
    this.life -= 1
    this.life = constrain(this.life, 0, this.lifeTime)
  }
  
  draw() {
    let _alpha = map(this.life, this.lifeTime, 0, this.startAlpha, 0)
    // _alpha = 150
    
    let drawSize = map(this.life, this.lifeTime, 0, this.startSize, this.endSize)
    
    noStroke()
    // fill(255, _alpha)
    this.color.setAlpha(_alpha)
    fill(this.color)
    // noFill()
    // stroke(255, _alpha)
    
    let lineWidth = 50
    
    circle(this.pos.x, this.pos.y, drawSize)
    
    // strokeCap(SQUARE)
    // strokeWeight(2)
    // stroke(this.color)
    // line(this.pos.x - lineWidth, this.pos.y, this.pos.x + lineWidth, this.pos.y)
  }
}

// ========================================
// Timer ==================================
// ========================================

class Timer {
  constructor(duration = 1) {
    this.startTime = 0
    this.duration = duration
    this.timeElapsed = 0
    this.isRunning = false
  }
  
  start() {
    this.startTime = millis()
    this.isRunning = true
  }
  
  get currentTime() {
    if (this.isRunning) {
      this.timeElapsed = millis() - this.startTime
      this.timeElapsed = constrain(this.timeElapsed, 0, this.duration)

      if (this.timeElapsed === this.duration) {
        this.isRunning = false
      }
    }
    
    return this.timeElapsed
  }
}