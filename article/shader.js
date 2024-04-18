// based on https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Textures_from_code

let gl;
let program;

const vertexShaderSource = `#version 100
precision highp float;
uniform vec2 iResolution;

attribute vec2 position;
varying vec2 v_FragPos;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    v_FragPos = (position * 0.5) * iResolution.xy; // centered coordinate
}
`

const fragmentShaderHeader = `#version 100
precision highp float;
uniform vec2 iResolution;
uniform float iTime;

varying vec2 v_FragPos;

`

const pauseFragmentFooter = `
float antialias(float line, float pos) {
  return smoothstep(line + 2.0, line, pos);
}

vec4 playTriangle(vec2 pos, float radius) {
    float width = radius * 0.75;
    float height = radius;
    float x = (pos.x / (width*2.0)) + 0.5;
    float topLine = mix(height, 0.0, x);
    return vec4(
      antialias(topLine, pos.y) *
      antialias(topLine, -pos.y) *
      antialias(width, -pos.x)
    );
}

void main() {
    vec4 outColor = vec4(0.0);
    mainImage(outColor, v_FragPos.xy);
    gl_FragColor += vec4(outColor.rgb * 0.25, 1.0);

    vec4 overlay = 0.75 * playTriangle(v_FragPos.xy, 80.0);
    gl_FragColor = gl_FragColor * (1.0 - overlay.a) + overlay;
}
`

const fragmentShaderFooter = `
void main() {
    vec2 center = iResolution.xy * 0.5;
    mainImage(gl_FragColor, v_FragPos.xy);
    //gl_FragColor = vec4(v_FragPos.xy / iResolution.xy, 0.0, 1.0);
    //gl_FragColor = vec4(gl_FragCoord.xy / iResolution.xy, 0.0, 1.0);
}
`


function setupOnLoad() {
  const canvas = document.body.appendChild(createOverlayCanvas());
  
  const gl = createRenderingContext(canvas);
  if (!gl) return;

  // concat shader lib to single header
  const shaderLib = [...document.querySelectorAll(".shader-lib")].map(e => e.textContent).join("\n");

  // compile and add shader elements
  const manager = new ShaderManager(gl, canvas);
  document.querySelectorAll(".shader").forEach((element) => initShader(gl, element, shaderLib, manager));

  manager.run();
}

class FullscreenShaderRenderer {
  gl
  buffer

  constructor(gl) {
    // triangle that covers screen
    const points = new Float32Array([
      -1.0, -1.0,
      3.0, -1.0,
      -1.0, 3.0
    ]);

    this.gl = gl;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  draw(program, bounds, scale, time, otherUniforms) {
    if (bounds.bottom < 0 || bounds.top > this.gl.drawingBufferHeight
      || bounds.left < 0 || bounds.right > this.gl.drawingBufferWidth) {
        return
    }

    this.gl.useProgram(program);

    this.gl.enable(this.gl.SCISSOR_TEST);
    // y coordinate is from bottom
    const bottom = this.gl.drawingBufferHeight - bounds.bottom*scale;
    this.gl.scissor(bounds.left*scale, bottom, bounds.width*scale, bounds.height*scale);
    this.gl.viewport(bounds.left*scale, bottom, bounds.width*scale, bounds.height*scale);

    // pass time to program
    this.gl.uniform1f(this.gl.getUniformLocation(program, "iTime"), time / 1000.0);

    // pass slider values
    for (let [name, value] of Object.entries(otherUniforms)) {
      this.gl.uniform1f(this.gl.getUniformLocation(program, name), value);
    }

    // pass canvas size to program
    this.gl.uniform2f(
      this.gl.getUniformLocation(program, "iResolution"),
      bounds.width,
      bounds.height
    );

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  cleanup() {
    this.gl.useProgram(null);
    if (this.buffer)
      this.gl.deleteBuffer(this.buffer);
  }
}

function compileProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const program = gl.createProgram();

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  gl.attachShader(program, vertexShader);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource)
  gl.compileShader(fragmentShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

// holds the programs associated with each canvas
// tracks running animation and pausing
class ShaderManager {
  gl
  canvas
  renderer
  staticShaders = new Set()
  animatedShader = null
  uniformValues = {}

  constructor(gl, canvas) {
    this.gl = gl
    this.canvas = canvas
    this.renderer = new FullscreenShaderRenderer(gl);
  }

  run() {
    window.addEventListener("resize", () => this.onViewportChanged(), { passive: true });
    window.addEventListener("scroll", () => this.onViewportChanged(), { passive: true });
    this.requestFrame();
  }

  createShaderElement(element, program, animatedProgram = null) {
    return {
      element,
      program,
      animatedProgram,
      time: 0.0
    }
  }

  addStaticShader(container, program) {
    this.staticShaders.add(this.createShaderElement(container, program));
  }

  play(animatedElement) {
    if (this.animatedShader === null) {
      // start animation
      this.requestFrame();
    }
    this.animatedShader = animatedElement;
    this.staticShaders.delete(animatedElement);
  }

  pause() {
    this.drawElement(this.animatedShader.element, this.animatedShader.program, performance.now());
    this.staticShaders.add(this.animatedShader);
    this.animatedShader = null;
  }

  addAnimatedShader(container, runningProgram, pausedProgram) {
    const shaderElem = this.createShaderElement(container, pausedProgram, runningProgram);

    container.addEventListener("mousedown", () => {
      if (this.animatedShader === shaderElem) {
        this.pause();
      } else {
        this.play(shaderElem);
      }
    }, { passive: true });

    this.staticShaders.add(shaderElem);
  }

  drawElement(container, program, scale, time) {
    const bounds = container.getBoundingClientRect();
    this.renderer.draw(program, bounds, scale, time, this.uniformValues);
  }

  frameRequested = false
  drawFrame(time) {
    this.frameRequested = false;
    const scale = window.devicePixelRatio;
    resizeCanvas(this.canvas, scale);
    this.gl.disable(this.gl.SCISSOR_TEST);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.staticShaders.forEach(s => this.drawElement(s.element, s.program, scale, s.time));
    if (this.animatedShader) {
      console.log("Animate")
      const shader = this.animatedShader;
      shader.time = time;
      this.drawElement(shader.element, shader.animatedProgram, scale, shader.time);
      this.requestFrame();
    }
  }

  requestFrame() {
    if (!this.frameRequested) {
      this.frameRequested = true;
      requestAnimationFrame((t) => this.drawFrame(t));
    }
  }

  onViewportChanged() {
    this.requestFrame();
  }

  setUniform(name, value) {
    if (this.uniformValues[name] !== value) {
      this.uniformValues[name] = value;
      this.requestFrame();
    }
  }
}

function initShader(gl, rootElement, shaderLibCode, shaderManager) {
  const mainCode = rootElement.querySelector(".shader-main").textContent;
  const fragmentShaderSource = fragmentShaderHeader + shaderLibCode + mainCode + fragmentShaderFooter;
  const program = compileProgram(gl, vertexShaderSource, fragmentShaderSource);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const linkErrLog = gl.getProgramInfoLog(program);
    console.log(fragmentShaderSource);
    putError(rootElement, `Shader program did not link successfully. Error log: ${linkErrLog}`);
    return;
  }

  const isAnimated = rootElement.classList.contains("animated");
  const container = rootElement.querySelector(".canvas");

  const inputs = rootElement.querySelectorAll(".shader-input");
  inputs.forEach((input) => initInputElement(input, shaderManager));

  if (isAnimated) {
    const pauseProgram = createPauseOverlayProgram(gl, shaderLibCode, mainCode);
    shaderManager.addAnimatedShader(container, program, pauseProgram);
  } else {
    shaderManager.addStaticShader(container, program);
  }
}

function initInputElement(inputElement, shaderManager) {
  function update() {
    const name = inputElement.dataset.uniform;
    const value = inputElement.valueAsNumber;
    shaderManager.setUniform(name, value);
  }

  inputElement.addEventListener("input", update);
  update();
}

function createPauseOverlayProgram(gl, shaderLibCode, mainCode) {
  const pauseCode = fragmentShaderHeader + shaderLibCode + mainCode + pauseFragmentFooter;
  return compileProgram(gl, vertexShaderSource, pauseCode);
}

function createRenderingContext(canvas) {
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) {
    alert(
      "Failed to get WebGL context." +
      "Your browser or device may not support WebGL."
    );
    return null;
  }
  return gl;
}

function createOverlayCanvas() {
  const overlay = document.createElement("canvas");
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.transformOrigin = "0 0";
  document.body.appendChild(overlay);
  return overlay;
}

function resizeCanvas(canvas, scale = 1) {
  const transform = `translate(${window.scrollX}px, ${window.scrollY}px)`
  if (canvas.style.transform !== transform) {
    canvas.style.transform = transform;
  }
  const w = canvas.clientWidth * scale;
  const h = canvas.clientHeight * scale;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function putError(rootElement, errorText) {
  const text = rootElement.appendChild(document.createElement("pre"));
  text.textContent = errorText;
  text.style.color = "red";
}

setupOnLoad();