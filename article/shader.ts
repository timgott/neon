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
  const shaderLib = Array.from(document.querySelectorAll(".shader-lib")).map(e => e.textContent).join("\n");

  // compile and add shader elements
  const manager = new ShaderManager(gl, canvas);
  document.querySelectorAll(".shader").forEach((element) => initShader(gl, element, shaderLib, manager));

  manager.run();
}

type UniformDict = { [key: string]: number }

class FullscreenShaderRenderer {
  gl: WebGLRenderingContext
  buffer: WebGLBuffer

  constructor(gl: WebGLRenderingContext) {
    // triangle that covers screen
    const points = new Float32Array([
      -1.0, -1.0,
      3.0, -1.0,
      -1.0, 3.0
    ]);

    this.gl = gl;
    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  draw(program: WebGLProgram, bounds: DOMRect, scale: number, time: number, otherUniforms: UniformDict) {
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

function compileProgram(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
  const program = gl.createProgram()!;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  gl.attachShader(program, vertexShader);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
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
type ShaderElement = {
  element: Element,
  program: WebGLProgram,
  uniformValues: UniformDict,
  time: number
}
type AnimatedShaderElement = ShaderElement & { animatedProgram: WebGLProgram }

class ShaderManager {
  gl: WebGLRenderingContext
  canvas: HTMLCanvasElement
  renderer: FullscreenShaderRenderer
  staticShaders = new Set<ShaderElement>()
  animatedShader: AnimatedShaderElement | null = null
  observer: MutationObserver

  constructor(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
    this.gl = gl
    this.canvas = canvas
    this.renderer = new FullscreenShaderRenderer(gl);
    this.observer = new MutationObserver(() => {
      console.log("Resize observed!!")
      this.onViewportChanged()
    });
  }

  run() {
    // viewport size changes
    window.addEventListener("resize", () => this.onViewportChanged(), { passive: true });
    window.addEventListener("scroll", () => this.onViewportChanged(), { passive: true });
    // detect details tags opening
    this.observer.observe(document.body, { subtree: true, attributeFilter: ["open"]});
    this.requestFrame();
  }

  createShaderElement(element: Element, program: WebGLProgram, animatedProgram?: WebGLProgram): ShaderElement | AnimatedShaderElement {
    return {
      element,
      program,
      animatedProgram,
      time: 0.0,
      uniformValues: {}
    }
  }

  registerContainer(container: Element) {
    //this.observer.observe(container, {attributes: true, childList: true, subtree: true});
  }

  addStaticShader(container: Element, program: WebGLProgram): ShaderElement {
    const elem = this.createShaderElement(container, program);
    this.registerContainer(container);
    this.staticShaders.add(elem);
    return elem;
  }

  play(animatedElement: AnimatedShaderElement) {
    if (this.animatedShader === null) {
      // start animation
      this.requestFrame();
    }
    this.animatedShader = animatedElement;
    this.staticShaders.delete(animatedElement);
  }

  pause(animatedElement: AnimatedShaderElement) {
    if (this.animatedShader === animatedElement) {
      this.staticShaders.add(this.animatedShader);
      this.animatedShader = null;
    }
  }

  addAnimatedShader(container: Element, runningProgram: WebGLProgram, pausedProgram: WebGLProgram): AnimatedShaderElement {
    const shaderElem = this.createShaderElement(container, pausedProgram, runningProgram) as AnimatedShaderElement;
    this.registerContainer(container);

    container.addEventListener("mousedown", () => {
      if (this.animatedShader === shaderElem) {
        this.pause(shaderElem);
      } else {
        this.play(shaderElem);
      }
    }, { passive: true });

    this.staticShaders.add(shaderElem);
    return shaderElem;
  }

  drawElement(container: Element, program: WebGLProgram, scale: number, time: number, uniforms: UniformDict) {
    const bounds = container.getBoundingClientRect();
    this.renderer.draw(program, bounds, scale, time, uniforms);
  }

  frameRequested = false
  drawFrame(time: number) {
    this.frameRequested = false;
    const scale = window.devicePixelRatio;
    resizeCanvas(this.canvas, scale);
    this.gl.disable(this.gl.SCISSOR_TEST);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.staticShaders.forEach(s => this.drawElement(s.element, s.program, scale, s.time, s.uniformValues));
    if (this.animatedShader) {
      console.log("Animate")
      const shader = this.animatedShader;
      shader.time = time;
      this.drawElement(shader.element, shader.animatedProgram, scale, shader.time, shader.uniformValues);
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

  setUniform(shader: ShaderElement, name: string, value: any) {
    if (shader.uniformValues[name] !== value) {
      shader.uniformValues[name] = value;
      this.requestFrame();
    }
  }

  setGlobalUniform(name: string, value: any) {
    this.staticShaders.forEach(shader => {
      shader.uniformValues[name] = value;
    })
    this.requestFrame();
  }
}

function initShader(gl: WebGLRenderingContext, rootElement: Element, shaderLibCode: string, shaderManager: ShaderManager) {
  const mainCode = rootElement.querySelector(".shader-main")!.textContent!;
  const fragmentShaderSource = fragmentShaderHeader + shaderLibCode + mainCode + fragmentShaderFooter;
  const program = compileProgram(gl, vertexShaderSource, fragmentShaderSource);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const linkErrLog = gl.getProgramInfoLog(program);
    console.log(fragmentShaderSource);
    putError(rootElement, `Shader program did not link successfully. Error log: ${linkErrLog}`);
    return;
  }

  const isAnimated = rootElement.classList.contains("animated");
  const container = rootElement.querySelector(".canvas")!;

  let shader: ShaderElement;
  if (isAnimated) {
    const pauseProgram = createPauseOverlayProgram(gl, shaderLibCode, mainCode);
    shader = shaderManager.addAnimatedShader(container, program, pauseProgram);
  } else {
    shader = shaderManager.addStaticShader(container, program);
  }

  const inputs = rootElement.querySelectorAll(".shader-input");
  inputs.forEach((input) => initInputElement(input as HTMLInputElement, shaderManager, shader));
}

function initInputElement(inputElement: HTMLInputElement, shaderManager: ShaderManager, shader?: ShaderElement) {
  function update() {
    const name = inputElement.dataset.uniform!;
    const value = inputElement.valueAsNumber;
    if (shader) {
      shaderManager.setUniform(shader, name, value);
    } else {
      shaderManager.setGlobalUniform(name, value);
    }
  }

  inputElement.addEventListener("input", update);
  update();
}

function createPauseOverlayProgram(gl: WebGLRenderingContext, shaderLibCode: string, mainCode: string) {
  const pauseCode = fragmentShaderHeader + shaderLibCode + mainCode + pauseFragmentFooter;
  return compileProgram(gl, vertexShaderSource, pauseCode);
}

function createRenderingContext(canvas: HTMLCanvasElement | OffscreenCanvas): WebGLRenderingContext | null {
  const gl = canvas.getContext("webgl") as WebGLRenderingContext | null; // cast not necessary in newer tsc
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

function resizeCanvas(canvas: HTMLCanvasElement, scale = 1) {
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

function putError(rootElement: Element, errorText: string) {
  const text = rootElement.appendChild(document.createElement("pre"));
  text.textContent = errorText;
  text.style.color = "red";
}

setupOnLoad();