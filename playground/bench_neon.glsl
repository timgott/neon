float neon_line(vec2 p, vec2 start, vec2 end, float z) {
    p = p - start;
    vec2 q = end - start;
    float x = p.x;
    float y = p.y;
    float a = q.x;
    float b = q.y;
    float x0 = a*x;
    float x1 = b*y;
    float x2 = pow(a, 2.0);
    float x3 = pow(b, 2.0);
    float x4 = x2 + x3;
    float x5 = 1.0/sqrt(pow(x, 2.0)*x3 - 2.0*x0*x1 + x2*pow(y, 2.0) + x4*pow(z, 2.0));
    return x5*(atan(x5*(x0 + x1)) + atan(x5*(-1.0*x0 - 1.0*x1 + x4)));
}
/*
float neon_line(vec2 p, vec2 start, vec2 end, float z) {
    p = p - start;
    vec2 q = end - start;
    vec2 m = p*q;
    m.x = m.x;
    m.y = m.y;
    float d = m.x + m.y;
    vec2 psqr = p*p;
    vec2 qsqr = q*q;
    float zsqr = pow(z, 2.0);
    float r = dot(p.xy, q.yx); // p.x*q.y + p.y*q.x;
    float rsqr = r*r;
    x5 = 1.0/sqrt(psqr.x*qsqr.y - 2.0*m.x*m.y + qsqr.x*psqr.y + qsqr.x*zsqr + qsqr.y*zsqr);
    x5 = 1.0/sqrt(p.x*p.x*q.y*q.y - 2.0*p.x*q.x*p.y*q.y + q.x*p.y + qsqr.x*zsqr + qsqr.y*zsqr);
    result = x5*(atan(x5*d) + atan(x5*(qsqr.x + qsqr.y - d)));
}*/

float neon_line2(vec2 p, vec2 start, vec2 end, float z) {
    // made from manual simplification of Wolfram Alpha integral
    p = p - start;
    vec2 q = end - start;
/*
    float x = p.x;
    float y = p.y;
    float u = q.x;
    float v = q.y;
    float a = u*u + v*v; // dot(q, q)
    float b = u*x + v*y; // dot(q, p)
    float c = v*x - u*y; // cross(q, p)
*/
    float a = dot(q, q);
    float b = dot(q, p);
    float c = q.y*p.x - q.x*p.y;
    float r = 1.0/sqrt(z*z*a + c*c);
    return (atan((a - b)*r) - atan(-b*r))*r;
}

float neon_line3(vec2 p, vec2 start, vec2 end, float z) {
    // computer-generated integral, expanded, no cse, no compact
    p = p - start;
    vec2 q = end - start;
    float a = q.x;
    float b = q.y;
    float x = p.x;
    float y = p.y;
    // generate_glsl(neon_line.expand(), compact=False, cse=False, expand_pow=True)
    return 1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z))*atan(a*x*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z)) + b*y*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z))) + 1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z))*atan(-1.0*a*x*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z)) - 1.0*b*y*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z)) + (a*a)*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z)) + (b*b)*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z)));
}

float neon_line4(vec2 p, vec2 start, vec2 end, float z) {
    // computer-generated integral, simplify(), no cse
    p = p - start;
    vec2 q = end - start;
    float a = q.x;
    float b = q.y;
    float x = p.x;
    float y = p.y;
    // generate_glsl(neon_line, compact=False, cse=False, expand_pow=True)
    return 1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z))*atan((a*x + b*y)*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z))) + 1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z))*atan(1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (a*a)*(z*z) + (b*b)*(x*x) + (b*b)*(z*z))*(-1.0*a*x - 1.0*b*y + a*a + b*b));
}

float neon_line5(vec2 p, vec2 start, vec2 end, float z) {
    // computer-generated integral, no cse
    p = p - start;
    vec2 q = end - start;
    float a = q.x;
    float b = q.y;
    float x = p.x;
    float y = p.y;
    // generate_glsl(neon_line, compact=False, cse=False, expand_pow=True)
    return -1.0*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (b*b)*(x*x) + (z*z)*(a*a + b*b))*(-1.0*atan((a*x + b*y)*1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (b*b)*(x*x) + (z*z)*(a*a + b*b))) - 1.0*atan(1.0/sqrt(-2.0*a*b*x*y + (a*a)*(y*y) + (b*b)*(x*x) + (z*z)*(a*a + b*b))*(-1.0*a*x - 1.0*b*y + a*a + b*b)));
}

float neon_line6(vec2 p, vec2 start, vec2 end, float z) {
    // computer-generated integral, cse enabled
    p = p - start;
    vec2 q = end - start;
    float a = q.x;
    float b = q.y;
    float x = p.x;
    float y = p.y;
    // generate_glsl(neon_line, compact=False, cse=True, expand_pow=True)
    float x0 = a*x;
    float x1 = b*y;
    float x2 = a*a;
    float x3 = z*z;
    float x4 = b*b;
    float x5 = 1.0/sqrt(-2.0*x0*x1 + x2*x3 + x2*(y*y) + x3*x4 + x4*(x*x));
    float result = x5*(atan(x5*(x0 + x1)) + atan(x5*(-1.0*x0 - 1.0*x1 + x2 + x4)));
    return result;
}

float neon_line7(vec2 p, vec2 start, vec2 end, float z) {
    // computer-generated integral, cse enabled
    p = p - start;
    vec2 q = end - start;
    float a = q.x;
    float b = q.y;
    float x = p.x;
    float y = p.y;
    // generate_glsl(neon_line, compact=False, cse=True, expand_pow=False)
    float x0 = a*x;
    float x1 = b*y;
    float x2 = pow(a, 2.0);
    float x3 = pow(z, 2.0);
    float x4 = pow(b, 2.0);
    float x5 = 1.0/sqrt(pow(x, 2.0)*x4 - 2.0*x0*x1 + x2*x3 + x2*pow(y, 2.0) + x3*x4);
    float result = x5*(atan(x5*(x0 + x1)) + atan(x5*(-1.0*x0 - 1.0*x1 + x2 + x4)));
    return result;
}

float neon_line8(vec2 p, vec2 start, vec2 end, float z) {
    // computer-generated integral, cse enabled
    p = p - start;
    vec2 q = end - start;
    float a = q.x;
    float b = q.y;
    float x = p.x;
    float y = p.y;
    // generate_glsl(neon_line, compact=False, cse=True, expand_pow=False)
    float x0 = a*a;
    float x1 = x0 + b*b;
    float x2 = b*x;
    float x3 = 1.0/sqrt(x0*(y*y) + x1*(z*z) - 1.0*x2*(2.0*a*y - 1.0*x2));
    float x4 = a*x;
    float x5 = b*y;
    float result = x3*(atan(x3*(x4 + x5)) + atan(x3*(x1 - 1.0*x4 - 1.0*x5)));
    return result;
}

float neon_line9(vec2 p, vec2 start, vec2 end, float z) {
    p = p - start;
    vec2 q = end - start;

    float x = p.x;
    float y = p.y;
    float a = q.x;
    float b = q.y;
    float x0 = a*x;
    float x1 = b*y;
    float x2 = a*a;
    float x3 = z*z;
    float x4 = b*b;
    float x5 = 1.0/sqrt(-2.0*x0*x1 + x2*x3 + x2*(y*y) + x3*x4 + x4*(x*x));
    float result = x5*(atan(x5*(x0 + x1)) + atan(x5*(-1.0*x0 - 1.0*x1 + x2 + x4)));
    return x5*(atan(x5*(x0 + x1)) + atan(x5*(-1.0*x0 - 1.0*x1 + x4)));
}

float point_light(vec2 p, vec2 lightPos, float z) {
    vec2 d = p - lightPos;
    return 1.0 / (dot(d, d) + z*z);
}

float neon_line_iter(vec2 p, vec2 start, vec2 end, float z) {
    const float step = 1. / 50.;
    float f = 0.;
    for(float i = 0.; i < 1.; i += step){
       f += step * point_light(p, mix(start, end, i), z);
    }
    return f;
}

void mainImage( out vec4 outColor, in vec2 pos )
{
    vec2 center = iResolution.xy * 0.5;
    vec2 line = vec2(40.0, 40.0);
    vec2 p1 = center - line * 0.5;
    vec2 p2 = center + line * 0.5;
    float z = 0.1;
 
    float f = 0.1;
    for(int i = 0; i < 100; i++){
       f += neon_line(pos, p1, p2, z);
       z += 0.1;
    }

    outColor = vec4(f * 1.0);
}