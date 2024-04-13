// based on https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Textures_from_code

window.addEventListener("load", setupOnLoad, false);

let gl;
let program;

const vertexShaderSource = `
#version 100
precision highp float;

attribute vec2 position;

void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShaderSource_test = `
#version 100
precision mediump float;
void main() {
    vec2 fragmentPosition = 2.0*gl_PointCoord - 1.0;
    float dist = length(fragmentPosition);
    float distSqr = dist * dist;
    gl_FragColor = vec4(
        0.2/distSqr,
        0.1/distSqr,
        0.0, 1.0
    );
}
`

const fragmentShaderHeader = `
#version 100
precision highp float;
uniform vec2 iResolution;
`

const fragmentShaderFooter = `
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`


function setupOnLoad(evt) {
  window.removeEventListener(evt.type, setupOnLoad, false);
  document.querySelectorAll(".shader").forEach(initShader);
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

  draw(program) {
    this.gl.useProgram(program);

    // pass canvas size to program
    gl.uniform2f(
      gl.getUniformLocation(program, "iResolution"),
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
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

function initShader(rootElement) {
  // take text content of script as shader source
  const code = rootElement.querySelector(".shader-code").textContent;
  console.log(code);

  const canvas = rootElement.querySelector("canvas");

  // create canvas and GL rendering context
  if (!(gl = createRenderingContext(canvas))) return;
  
  const fragmentShaderSource = fragmentShaderHeader + code + fragmentShaderFooter;
  const program = compileProgram(gl, vertexShaderSource, fragmentShaderSource);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const linkErrLog = gl.getProgramInfoLog(program);
    putError(rootElement, `Shader program did not link successfully. Error log: ${linkErrLog}`);
    return;
  }

  const renderer = new FullscreenShaderRenderer(gl);
  renderer.draw(program);
  renderer.cleanup();

  if (program) {
    gl.deleteProgram(program);
  }
}

function createRenderingContext(canvas) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) {
    alert(
      "Failed to get WebGL context." +
      "Your browser or device may not support WebGL."
    );
    return null;
  }
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return gl;
}

function putError(rootElement, errorText) {
  const text = rootElement.appendChild(document.createElement("pre"));
  text.textContent = errorText;
  text.style.color = "red";
}
