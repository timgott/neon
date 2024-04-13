---
title: Neon Integrals
header-includes: |
    <style>
    .shader canvas {
        background: black;
        width: 100%;
        height: 100%;
        height: 200pt;
    }
    </style>
include-after: <script src="./shader.js"></script>
---

Here I will explain how to paint neon lines with math like this:

<div class="shader">
<pre class="shader-code">
void mainImage(out vec4 outColor, in vec2 pos) {
    vec2 center = iResolution * 0.5;
    float d = distance(pos, center);
    float v = 100.0/(d);
    outColor = vec4(v, v*0.8+0.1, 1.0, 0.5);
}
</pre>
<canvas></canvas>
</div>

We will start by drawing a point light, then we will automatically derive an integral to extend the point to a line.

## Light from a point

Consider a single point shining light onto an infinite wall. Physics tells us that light intensity is the [inverse square](https://en.wikipedia.org/wiki/Inverse-square_law) of the distance. Thus, if the light is at $(x,y,z)$, then a point $(u,v,w)$ on the wall receives a light intensity of

$$
L(x,y,z) = \frac{1}{(x-u)^2+(y-v)^2+(z-w)^2}
$$

We can paint this with a GLSL shader (à la [Shadertoy](https://www.shadertoy.com/)):

TODO: INSERT SHADER AND DEMO: point light

If you want multiple lights, you can just add them:

TODO: INSERT SHADER AND DEMO: three point lights

## Integrating the line

Now what about a line that emits light like a neon tube?

Think of a line as an continuous set of points. We want each of these points to behave as a point light. You can approximate this with a finite number of point lights:

TODO: INSERT SHADER AND DEMO: line of point lights

However, you need a lot of points to cover a long line. So let's derive the light emitted from the infinite points on a continuous line analytically. What was a sum now becomes an integral.

We can describe the points on a line from $(0, 0, 0)$ to $(x,y,z)$ as a linear interpolation:
$$
(tx, ty, tz)
$$

For such a line, the light received at $(u,v,w)$ is

$$
\int_0^1 L(u-tx,u-ty,w - tz) \, dt,
$$

where $L$ is still the light from a single point light, and $a$ and $b$ are the start and end of the line on the $x$-axis.

## Let the computer do the math

We now have the integral, but we still need to solve it. Luckily there are Computer Algebra Systems (CAS) that for us (though not all of them can solve all integrals equally well). Put the following into [Wolfram Alpha](https://www.wolframalpha.com/input?i=integrate%281%2F%28%28x-t*u%29%5E2%2B%28y-t*v%29%5E2%2B%28z-t*w%29%5E2%29%2Ct%29):

```mathematica
integrate(1/((x-t*u)^2+(y-t*v)^2+(z-t*w)^2), t)
```

You get a formula as output that you can directly translate into code. You can make the code a bit shorter by eliminating common subexpressions. You can do this step by hand. but the whole process could also be partially automated, from [integral](https://doc.sagemath.org/html/en/reference/calculus/sage/symbolic/integration/integral.html#sage.symbolic.integration.integral.integral) to [simplification](https://docs.sympy.org/latest/modules/codegen.html#sympy.codegen.ast.CodeBlock.cse).

TODO: Link Sagemath notebook?

Here is my resulting shader:

TODO: INSERT SHADER AND DEMO: line integral

## Curved lines

Similarly to what we did for straight lines, we can also compute the integral for a circle arc, with $\sin$ and $\cos$ for the coordinates:

```mathematica
integrate(1/((x - sin(t))^2 + (y - cos(t))^2 + z^2), t)
```

The result:

TODO: INSERT ARC SHADER

## NEON ART

Now combine:

TODO: INSERT HEART SHADER
