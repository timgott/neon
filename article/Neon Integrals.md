---
title: Neon Integrals
header-includes: |
    <style>
    .shader canvas {
        background: black;
        width: 100%;
        height: 200pt;
        margin: 12pt 0px;
    }
    .shader .big {
        height: 400pt;
    }
    </style>
include-after: <script src="./shader.js"></script>
---

Here I will explain how to paint with math to get neon lines like this:

<noscript><em>You need JavaScript to show the example shaders!</em></noscript>

<div class="shader">
<script type="text/x-glsl" class="shader-main">
vec3 neon_x(vec2 p, vec2 center, float r, float z) {
    Line line1 = Line(center + vec2(-r, r), center + vec2(r, -r), z);
    Line line2 = Line(center + vec2(r, r), center + vec2(-r, -r), z);
    vec3 pink = vec3(1.0, 0.1, 1.0);
    vec3 orange = vec3(1.0, 0.1, 0.1);
    return
        pink * lineNeon(p, line1) +
        orange * lineNeon(p, line2);
}

vec3 neon_triangle(vec2 p, vec2 center, float r, float z) {
    vec2 top = center + vec2(0, r);
    vec2 left = center + vec2(-r, -r);
    vec2 right = center + vec2(r, -r);
    Line line1 = Line(top, left, z);
    Line line2 = Line(left, right, z);
    Line line3 = Line(right, top, z);
    vec3 blue = vec3(0.1, 0.5, 1.0);
    vec3 green = vec3(0.1, 1.0, 0.5);
    vec3 yellow = vec3(1.0, 0.5, 0.5);
    return
        blue * lineNeon(p, line1) +
        blue * lineNeon(p, line2) +
        blue * lineNeon(p, line3);
}

vec3 neon_box(vec2 p, vec2 center, float r, float z) {
    vec2 p1 = center + vec2(-r, r);
    vec2 p2 = center + vec2(-r, -r);
    vec2 p3 = center + vec2(r, -r);
    vec2 p4 = center + vec2(r, r);
    Line line1 = Line(p1, p2, z);
    Line line2 = Line(p2, p3, z);
    Line line3 = Line(p3, p4, z);
    Line line4 = Line(p4, p1, z);
    vec3 blue = vec3(0.1, 0.5, 1.0);
    vec3 green = vec3(0.1, 1.0, 0.5);
    return
        green * lineNeon(p, line1) +
        green * lineNeon(p, line2) +
        green * lineNeon(p, line3) +
        green * lineNeon(p, line4);
}

void mainImage(out vec4 outColor, in vec2 pos) {
    vec2 center = vec2(0.0, 0.0);
    float z = 0.5;
    float intensity = 3.0;

    Line underline = Line(center + vec2(-150.0, -80.0), center + vec2(150.0, -80.0), z);

    vec3 c;
    c += neon_x(pos, center + vec2(85.0, -7.0), 50.0, z);
    c += 0.5 * neon_box(pos, center + vec2(-85.0, -7.0), 50.0, z);
    c += neon_triangle(pos, center + vec2(0.0, 0.0), 80.0, z);
    c *= intensity;
    outColor = vec4(tonemap(c), 0.0);
}
</script>
<canvas>This canvas should show an example shader</canvas>
</div>

We will start by drawing a point light, then we will extend the point to a line by deriving an integral automatically.

## Light from a point

Consider a single point shining light onto an infinite wall. Physics tells us that light intensity is the [inverse square](https://en.wikipedia.org/wiki/Inverse-square_law) of the distance. Thus, if the light is at $p=(x,y,z)$, then a point $q=(u,v,w)$ on the wall receives a light intensity of

$$
L(x,y,z) = \frac{1}{\|p-q\|^2} = \frac{1}{(x-u)^2+(y-v)^2+(z-w)^2}.
$$

That is all we need to paint this. Let's do this with a pixel shader à la [Shadertoy](https://www.shadertoy.com/). A pixel shader computes the output color at every coordinate (the coordinate $0, 0$ is in the middle for simplicity).

<div class="shader">

```glsl {.shader-lib}
float pointLight(vec3 p, vec3 light) {
    // translation of the formula above in vector form
    // p: sample point
    // light: light position
    vec3 d = p - light;
    return 1.0/dot(d, d);
}
```

```glsl {.shader-main}
void mainImage(out vec4 outColor, in vec2 coord) {
    // screen coordinate to 3d wall position
    vec3 p = vec3(coord, 0.0);

    // place the light in the center at depth 2
    vec3 lightPos = vec3(0.0, 0.0, 2.0);

    // compute light received at p
    float v = pointLight(p, lightPos);

    // multiply by intensity and get final color
    v *= 1000.0;

    // map to color
    vec3 blue = vec3(0.1, 0.5, 1.0);
    vec3 rgb = v * blue;
    outColor = vec4(rgb,0.0);
}
```
<canvas></canvas>
</div>

Good, but distorted: the circle in the middle is caused by clipping. We can compress light intensity to perceived brightness with [exposure][] and [gamma correction][]:

[exposure]: https://web.archive.org/web/20160418004149/http://freespace.virgin.net/hugo.elias/graphics/x_posure.htm
[gamma correction]: https://en.wikipedia.org/wiki/Gamma_correction

<div class="shader">
<div class="shader-code">

```glsl {.shader-lib}
// Gamma correction
vec3 gamma(vec3 x, float gamma) {
    return pow(x, vec3(1.0 / gamma));
}

// Exponential exposure
vec3 exposure(vec3 x) {
    return 1.0 - exp(-x);
}

// Combined tone mapping, tuned for appearance on this page
vec3 tonemap(vec3 x) {
    return gamma(exposure(x), 1.3);
}
```

Now apply that to the final color:

```glsl
void mainImage(out vec4 outColor, in vec2 coord) {
    // compute light intensity as before
    float v = ...;

    // map to color
    vec3 blue = vec3(0.1, 0.5, 1.0);
    vec3 rgb = tonemap(v * blue);
    outColor = vec4(rgb,1.0);
}
```

<script type="text/x-glsl" class="shader-main">
// hidden!!
void mainImage(out vec4 outColor, in vec2 coord) {
    // as before...
    vec3 p = vec3(coord, 0.0);
    vec3 light = vec3(0.0, 0.0, 2.0);
    float v = pointLight(p, light);
    v *= 1000.0;

    // map to color
    vec3 blue = vec3(0.1, 0.5, 1.0);
    //vec3 rgb = coord.x - 0.2*coord.y > 0.0 ? tonemap(v * blue) : v * blue;
    vec3 rgb = tonemap(v * blue);
    outColor = vec4(rgb,1.0);
}
</script>
</div>
<canvas></canvas>
</div>

This looks better. If you want multiple lights, take the sum of their intensities:

<div class="shader">

```glsl {.shader-main}
void mainImage(out vec4 outColor, in vec2 coord) {
    vec3 p = vec3(coord, 0.0);

    vec3 red = vec3(1.0, 0.2, 0.2);
    vec3 green = vec3(0.2, 1.0, 0.2);
    vec3 blue = vec3(0.2, 0.2, 1.0);

    vec3 color;
    color += red * pointLight(p, vec3(0.0, 30.0, 5.0));
    color += green * pointLight(p, vec3(-30.0, -20.0, 5.0));
    color += blue * pointLight(p, vec3(30.0, -20.0, 5.0));
    color *= 400.0;

    color = tonemap(color);
    outColor = vec4(color,1.0);
}
```

<canvas></canvas>
</div>

## Integrating the line

Now what about a line that emits light like a neon tube?

Think of a line as an continuous set of points. We want each of these points to behave as a point light. You can approximate this with a finite number of point lights:

<div class="shader">

<script type="text/x-glsl" class="shader-main">
void mainImage(out vec4 outColor, in vec2 coord) {
    vec3 p = vec3(coord, 0.0);

    vec3 red = vec3(1.0, 0.2, 0.2);

    vec3 color;
    const float step = 1./20.;
    vec3 line = vec3(300.0, 50.0, 0.0);
    for (float t = 0.0; t < 1.0; t += step) {
        color += red * step * pointLight(p, line * (t - 0.5));
    }
    color *= length(line) * 20.0;

    color = tonemap(color);
    outColor = vec4(color,1.0);
}
</script>

<canvas></canvas>
</div>

With 20 points, you can still see gaps. Increase it to 50:

<div class="shader">

<script type="text/x-glsl" class="shader-main">
void mainImage(out vec4 outColor, in vec2 coord) {
    vec3 p = vec3(coord, 0.0);

    vec3 red = vec3(1.0, 0.2, 0.2);

    vec3 color;
    const float step = 1./50.;
    vec3 line = vec3(300.0, 50.0, 0.0);
    for (float t = 0.0; t < 1.0; t += step) {
        color += red * step * pointLight(p, line * (t - 0.5));
    }
    color *= length(line) * 20.0;

    color = tonemap(color);
    outColor = vec4(color,1.0);
}
</script>

<canvas></canvas>
</div>

Now this looks cool! But what did it cost? Loops are expensive in shaders and the longer the line, the more points you need. This technique works fine for a static illustration like here, but it needs to be more efficient for a real time animation.

Can we do better? We can, by deriving a closed formula for a continuous line! That will get us the result for infinite points --- what was a sum now becomes an integral. For a line from $0, 0, 0$ to $x,y,z,$ that is

$$
\int_0^1 L(u-tx,u-ty,w - tz) \, dt,
$$

where $L$ is the light from a single point light as before, and $u,v,w$ is the receiving point on the wall.

## Let the computer do the math

Writing down the integral is good, but we still need to solve it. Luckily there are Computer Algebra Systems (CAS) that can do that for us (though not all of them can solve all integrals equally well).

Put the following into [Wolfram Alpha](https://www.wolframalpha.com/input?i=integrate%281%2F%28%28x-t*u%29%5E2%2B%28y-t*v%29%5E2%2B%28z-t*w%29%5E2%29%2Ct%29):

```mathematica
integrate(1/((x-t*u)^2+(y-t*v)^2+z^2), t)
```

The best antiderivative I got was this output from Wolfram Alpha:

$$
\frac{\arctan(\frac{t (u^2 + v^2) - u x - v y}{\sqrt{z^2 (u^2 + v^2) + (v x - u y)^2}})}{\sqrt{z^2 (u^2 + v^2) + (v x - u y)^2}}
$$

It might look complicated at first, but many of the terms repeat, so you can make the code a bit shorter by extracting them to variables (though the shader compiler will likely [do that optimization][cse wikipedia] too)[^automation].

[^automation]: The translation to code could be partially automated, from [integral](https://doc.sagemath.org/html/en/reference/calculus/sage/symbolic/integration/integral.html#sage.symbolic.integration.integral.integral) to [code simplification](https://docs.sympy.org/latest/modules/codegen.html#sympy.codegen.ast.CodeBlock.cse), but the most pretty form I got by doing it manually.

[cse wikipedia]: https://en.wikipedia.org/wiki/Common_subexpression_elimination

From the antiderivative we can compute the definite integral by evaluating at $t=0$ and $t=1$. Since the range is always 0 to 1, the total energy will be the same no matter how long the line is. Multiply the intensity by the length of the line to get a consistent brightness.

Here is my resulting code:

```glsl {.shader-lib}
struct Line {
    vec2 start;
    vec2 end;
    float z;
};

float lineNeon(vec2 p, Line line) {
    // move start to origin
    p = p - line.start;
    vec2 q = line.end - line.start;
    float z = line.z;

    // made from manual simplification of Wolfram Alpha integral
    float a = dot(q, q); // u^2 + v^2
    float b = dot(q, p); // u*x + v*y
    float c = q.y*p.x - q.x*p.y; // v*x - u*y
    float r = 1.0/sqrt(z*z*a + c*c);
    float len = sqrt(a); // additional correction for line length
    float F1 = atan((a - b)*r); // t=1
    float F0 = atan(-b*r); // t=0
    return (F1 - F0)*r * len;
}
```

Demonstrating this formula:

<div class="shader">

```glsl {.shader-main}
void mainImage(out vec4 outColor, in vec2 coord) {
    vec3 green = vec3(0.2, 0.7, 0.3);

    Line line = Line(vec2(150.0, 25.0), vec2(-150.0, -25.0), 0.0);
    vec3 color = green * lineNeon(coord, line);
    color *= 20.0;

    outColor = vec4(tonemap(color), 0.0);
}
```

<canvas></canvas>
</div>

## Curved lines

Similarly to what we did for straight lines, we can also compute the integral for a circle arc, with $\sin$ and $\cos$ for the coordinates:

```mathematica
integrate(1/((x - sin(t))^2 + (y - cos(t))^2 + z^2), t)
```

Assume the radius is 1 for now. Reducing the number of variables makes it easier to derive for both the computer and for ourselves. We can correct for that later by scaling the coordinates.

Wolfram Alpha does not handle larger periodic $t$ values directly (you have to add the `floor` part). I have computed this using Sage Math and manually rewritten:

```glsl {.shader-lib}
#define M_PI 3.14159265359

// Antiderivative of light from arc received at p
// t is angle in radians
float arcNeon_F(vec3 p, float t) {
    vec3 psqr = p*p;
    float v1 = psqr.x + psqr.y + 1.0;
    float v2 = psqr.x + psqr.y - 1.0;
    float v3 = tan(0.5*t)*(v1 + psqr.z + 2.0*p.y) - 2.0*p.x;
    float r = 1.0/sqrt(2.0*psqr.z * v1 + v2*v2 + psqr.z*psqr.z);
    return 2.0*(atan(v3*r) + M_PI*floor(0.5*(t/M_PI + 1.0)))*r;
}

// Interface to draw arcs:

struct Arc {
    vec3 center;
    float radius;
    float start;
    float end;
};

float arcNeon(
    vec2 uvpos,
    Arc arc
) {
    // coordinates scaled by radius
    vec3 p = (vec3(uvpos, 0.0) - arc.center) / arc.radius;

    // integral
    float F1 = arcNeon_F(p, arc.end);
    float F0 = arcNeon_F(p, arc.start);
    float integral = F1 - F0;

    // compensated for scaled coordinates (divide by radius^2)
    // and for arc length (multiply result by radius)
    return integral / arc.radius;
}
```

Testing this formula:

<div class="shader">

```glsl {.shader-main}
void mainImage(out vec4 outColor, in vec2 pos) {
    vec3 pink = vec3(1.0, 0.1, 1.0);

    vec3 color = pink * 2.0 * arcNeon(pos, Arc(vec3(0.0, 0.0, 2.0), 70.0, 0.0, 4.0));
    color *= 5.0;

    outColor = vec4(tonemap(color), 0.0);
}
```

<canvas></canvas>

</div>

Great! We can build shapes out of arcs and lines[^nobezier].

[^nobezier]: It would also be nice to have [Bézier curves][bezier], but the
computer cannot find the integral for them.

[bezier]: https://en.wikipedia.org/wiki/B%C3%A9zier_curve

<!--
### Other approximations

You can compute the distance to the line and compute the falloff based on that, but it is not the same, especially if you have 2 lines meeting at their endpoints.
-->

## NEON ART

That's it! We made shapes of light by deriving analytical integrals. There is much more that you can do with shaders, but I haven't seen this approach elsewhere. Have fun!

<div class="shader animated">

<canvas class="big"></canvas>

<details>
<summary>Code</summary>

```glsl {.shader-main}

float lineNeonAnimated(vec2 p, Line line, float t, float trail) {
    float t0 = clamp(t - trail, 0.0, 1.0);
    float t1 = clamp(t, 0.0, 1.0);
    vec2 p0 = mix(line.start, line.end, t0);
    vec2 p1 = mix(line.start, line.end, t1);
    if (t0 == t1) {
        return 0.0;
    }
    return lineNeon(p, Line(p0, p1, line.z));
}

float arcNeonAnimated(vec2 p, Arc arc, float t, float trail) {
    float t0 = clamp(t - trail, 0.0, 1.0);
    float t1 = clamp(t, 0.0, 1.0);
    if (t0 == t1) {
        return 0.0;
    }
    float a0 = mix(arc.start, arc.end, t0);
    float a1 = mix(arc.start, arc.end, t1);
    float s = arc.end > arc.start ? 1.0 : -1.0; // allow both directions
    return s*arcNeon(p, Arc(arc.center, arc.radius, a0, a1));
}

float heartAnimated(vec2 uvpos, float z, float l, float t) {
    const float period = 4.0;
    float t1 = mod(t - 0.0, period);
    float t2 = mod(t - 1.0, period);
    float t3 = mod(t - 2.0, period);
    float t4 = mod(t - 3.0, period);
    float v;
    float quarter = M_PI * 0.5;
    float radius = sqrt(0.5*0.5 + 0.5*0.5);

    Line lineR = Line(vec2(0.0, -1.0), vec2(1.0, 0.0), z);
    Line lineL = Line(vec2(-1.0, 0.0), vec2(0.0, -1.0), z);
    Arc arcR = Arc(vec3(0.5, 0.5, z), radius, M_PI*(3.0/4.0), M_PI*(3.0/4.0-1.0));
    Arc arcL = Arc(vec3(-0.5, 0.5, z), radius, M_PI*(1.0/4.0), M_PI*(1.0/4.0-1.0));

    v += lineNeonAnimated(uvpos, lineR, t1, l);
    //v += arcNeonAnimated(uvpos, vec3(0.5, 0.5, z), radius, M_PI*(3.0/4.0)-t2*M_PI, M_PI*(3.0/4.0)-s2*M_PI);
    v += arcNeonAnimated(uvpos, arcR, t2, l);
    //v += arcNeon(uvpos, arcR);
    //v += arcNeon(uvpos, arcL);
    v += arcNeonAnimated(uvpos, arcL, t3, l);
    v += lineNeonAnimated(uvpos, lineL, t4, l);
    return v;
}

float heartbeat(float t) {
    float speed = M_PI;
    t *= speed;
    return -pow((sin(t+1.2)+1.0)*0.5, 70.0) * 0.6 + pow((sin(t+0.3)+1.0)*0.5, 20.0) * 0.3 - pow((sin(t+2.8)+1.0)*0.5, 10.0)*0.2;
}

vec4 demoBeatingHeart(vec2 uvpos) {
    float time = iTime + 21.0;
    float bpmFactor = 80.0/60.0;
    float beat = heartbeat(time*bpmFactor);
    float phasing = (sin(time*1.3)+1.0)*0.5;
    float intensity = 0.3+0.2*beat;
    float z = 0.02 + 0.02 * beat;
    vec3 pink = vec3(0.9,0.2,1.0);
    vec3 red = vec3(0.8,0.1,0.3)*1.5; // perceived brightness multiplier
    vec3 blue = vec3(0.1,0.3,0.9);
    vec3 yellow = vec3(1.0,0.2,0.1);
    vec2 center = iResolution.xy * 0.5;
    float s = 100.0 + beat*10.0;
    uvpos /= s;
    vec3 c;
    c += red * intensity * heartAnimated(uvpos, z, 1.5, time * bpmFactor * 1.0 + 0.0);
    c += blue * 0.1 * heartAnimated(uvpos, z, 2.0, time*0.3+1.0);
    c += pink * 1.0 * pointLight(vec3(uvpos, z), vec3(0.0, 0.2, 0.5+beat*0.2));
    return vec4(tonemap(c), 1.0);
}

void mainImage(out vec4 out_color, in vec2 uvpos) {
    out_color = demoBeatingHeart(uvpos);
    //out_color = demo_pulsing(uvpos);
}

```

</details>

</div>


<!--If you are interested in playing with shaders, I can also recommend the material by [Inigo Quilez](https://www.youtube.com/@InigoQuilez) if you want an inspiration on what is possible!-->

