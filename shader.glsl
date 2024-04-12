#define M_PI 3.14159265359

float point_light(vec3 uvpos, vec3 light) {
    vec3 p = uvpos - light;
    vec3 psqr = p*p;
    return 1.0 / (psqr.x + psqr.y + psqr.z);
}

// integral of point_light over a line from (a, 0, 0) to (b, 0, 0)
float line_neon_integral(vec3 p, float a, float b) {
    float v1 = pow(p.y*p.y + p.z*p.z, -0.5);
    return v1*(atan(v1*(b - p.x)) - atan(v1*(a - p.x)));
}

float line_neon(vec2 uvpos, vec2 start, vec2 end, float z) {
    // can be simplified for horizontal/vertical lines
    float l = length(end - start);
    vec2 dir = (end - start) / l;
    vec2 side = vec2(-dir.y, dir.x);
    vec2 shifted = uvpos.xy - start;
    vec2 proj = vec2(dot(shifted, dir), dot(shifted, side));
    return line_neon_integral(vec3(proj, z), 0.0, l);
}

float line_neon_partial(vec2 uvpos, vec2 start, vec2 end, float z, float t0, float t1) {
    // can be simplified for horizontal/vertical lines
    float l = length(end - start);
    vec2 dir = (end - start) / l;
    vec2 side = vec2(-dir.y, dir.x);
    vec2 shifted = uvpos.xy - start;
    vec2 proj = vec2(dot(shifted, dir), dot(shifted, side));
    return line_neon_integral(vec3(proj, z), t0*l, t1*l);
}

// antiderivative of point_light integrated over an arc from (1,0,0) to p
float arc_neon_F(vec3 p, float r, float t) {
    vec3 psqr = p*p;
    float rsqr = r*r;
    float d = 2.0*r;
    float v1 = inversesqrt(2.0*(psqr.x*psqr.y + psqr.x*psqr.z - psqr.x + psqr.y*psqr.z - psqr.y + psqr.z) + 1.0 + psqr.x*psqr.x + psqr.y*psqr.y + psqr.z*psqr.z);
    float v2 = tan(0.5*t);
    return 2.0*v1*(atan(v1*(v2*(psqr.x + psqr.y + psqr.z + 2.0*p.y + 1.0) - 2.0*p.x)) + M_PI*floor(0.5*(t/M_PI + 1.0)));
}

float arc_neon(
    vec2 uvpos,
    vec3 center,
    float radius,
    float start,
    float end
) {
    // TODO: think about compensation and scaling for radius more thoroughly
    vec3 p = vec3((uvpos.xy - center.xy) / radius, center.z / radius);
    return (arc_neon_F(p, 1.0, end) - arc_neon_F(p, 1.0, start)) / radius;
}

float rounded_rectangle_neon(
    vec2 uvpos,
    vec2 lower,
    vec2 upper,
    float z,
    float radius
) {
    vec2 lower_inner = lower + vec2(radius, radius);
    vec2 upper_inner = upper - vec2(radius, radius);
    float v = 0.0;
    v += line_neon(uvpos, vec2(lower_inner.x, lower.y), vec2(upper_inner.x, lower.y), z);
    v += line_neon(uvpos, vec2(upper_inner.x, upper.y), vec2(lower_inner.x, upper.y), z);
    v += line_neon(uvpos, vec2(upper.x, lower_inner.y), vec2(upper.x, upper_inner.y), z);
    v += line_neon(uvpos, vec2(lower.x, upper_inner.y), vec2(lower.x, lower_inner.y), z);
    v += arc_neon(uvpos, vec3(upper_inner, z), radius, 0.0, M_PI*0.5);
    v += arc_neon(uvpos, vec3(lower_inner.x, upper_inner.y, z), radius, M_PI*1.5, M_PI*2.0);
    v += arc_neon(uvpos, vec3(lower_inner, z), radius, M_PI, M_PI*1.5);
    v += arc_neon(uvpos, vec3(upper_inner.x, lower_inner.y, z), radius, M_PI*0.5, M_PI);
    return v;
}

vec3 tonemap1(vec3 c) {
    return c / (c + 0.5);
}

vec3 tonemap2(vec3 c) {
    return 1.0 - exp(-c);
}

vec4 demo_pulsing(vec2 uvpos) {
    float z = 1.0;
    float intensity1 = 1.0*(1.0+sin(iTime*1.5)*0.5);
    float intensity2 = 2.0*(1.0+cos(iTime*2.5)*0.5);
    vec3 pink = vec3(0.7,0.2,1.0);
    vec3 blue = vec3(0.1,0.5,1.0);
    vec3 red = vec3(1.0,0.1,0.1);
    vec3 center = vec3(300.0,300.0,z);
    float radius = 200.0;
    float arc_start = cos(iTime*1.5)*M_PI*0.5;
    float angle = (sin(iTime*0.7)+1.0)*20.0;
    vec3 c;
    c += pink * intensity1 * arc_neon(uvpos, center, radius, arc_start, arc_start + angle);
    c += blue * intensity2 * rounded_rectangle_neon(uvpos, vec2(200.0, 200.0), vec2(400.0, 400.0), z, 50.0);
    c += red * intensity1 * 2000.0 * point_light(vec3(uvpos, z), vec3(300.0, 300.0, 0.0));
    return vec4(tonemap2(c), 1.0);
}

float heartbeat(float t) {
    float speed = M_PI;
    t *= speed;
    return -pow((sin(t+1.2)+1.0)*0.5, 70.0) * 0.6 + pow((sin(t+0.3)+1.0)*0.5, 20.0) * 0.3 - pow((sin(t+2.8)+1.0)*0.5, 10.0)*0.2;
}

float sequence(float t, float period, float offset, float duration) {
    return clamp((mod(t, period) + offset) / duration, 0.0, 1.0);
}

float heart_partial(vec2 uvpos, float z, float l, float t) {
    float t1 = sequence(t - 0.0, 4.0, 0.0, 1.0);
    float s1 = sequence(t - 0.0, 4.0, -l, 1.0);
    float t2 = sequence(t - 1.0, 4.0, 0.0, 1.0);
    float s2 = sequence(t - 1.0, 4.0, -l, 1.0);
    float t3 = sequence(t - 2.0, 4.0, 0.0, 1.0);
    float s3 = sequence(t - 2.0, 4.0, -l, 1.0);
    float t4 = sequence(t - 3.0, 4.0, 0.0, 1.0);
    float s4 = sequence(t - 3.0, 4.0, -l, 1.0);
    float v;
    float quarter = M_PI * 0.5;
    float radius = sqrt(0.5*0.5 + 0.5*0.5);
    v += line_neon_partial(uvpos, vec2(0.0, -1.0), vec2(1.0, 0.0), z, s1, t1);
    v += arc_neon(uvpos, vec3(0.5, 0.5, z), radius, M_PI*(3.0/4.0)-t2*M_PI, M_PI*(3.0/4.0)-s2*M_PI);
    v += arc_neon(uvpos, vec3(-0.5, 0.5, z), radius, M_PI*(1.0/4.0)-t3*M_PI, M_PI*(1.0/4.0)-s3*M_PI);
    v += line_neon_partial(uvpos, vec2(-1.0, 0.0), vec2(0.0, -1.0), z, s4, t4);
    return v;
}

float heart(vec2 uvpos, float z) {
    float v;
    v += line_neon(uvpos, vec2(0.0, -1.0), vec2(1.0, 0.0), z);
    v += line_neon(uvpos, vec2(-1.0, 0.0), vec2(0.0, -1.0), z);
    float quarter = M_PI * 0.5;
    float radius = sqrt(0.5*0.5 + 0.5*0.5);
    v += arc_neon(uvpos, vec3(-0.5, 0.5, z), radius, M_PI*(-3.0/4.0), M_PI*(1.0/4.0));
    v += arc_neon(uvpos, vec3(0.5, 0.5, z), radius, M_PI*(-1.0/4.0), M_PI*(3.0/4.0));
    return v;
}

vec4 demo_beating_heart(vec2 uvpos) {
    float bpmFactor = 80.0/60.0;
    float beat = heartbeat(iTime*bpmFactor);
    float phasing = (sin(iTime*1.3)+1.0)*0.5;
    float intensity = 0.4+0.2*beat;
    float z = 0.02 + 0.02 * beat;
    vec3 pink = vec3(0.9,0.2,1.0);
    vec3 red = vec3(0.8,0.1,0.3)*1.5; // perceived brightness multiplier
    vec3 blue = vec3(0.1,0.3,0.9);
    vec3 yellow = vec3(1.0,0.2,0.1);
    vec2 center = iResolution.xy * 0.5;
    float s = 100.0 + beat*10.0;
    uvpos -= center;
    uvpos /= s;
    vec3 c;
    c += red * intensity * heart_partial(uvpos, z, 1.5, iTime * bpmFactor * 1.0 + 0.0);
    c += blue * 0.1 * heart_partial(uvpos, z, 2.0, iTime*0.3+1.0);
    c += pink * 1.0 * point_light(vec3(uvpos, z), vec3(0.0, 0.2, 0.5+beat*0.2));
    return vec4(tonemap2(c), 1.0);
}

void mainImage(out vec4 out_color, in vec2 uvpos) {
    out_color = demo_beating_heart(uvpos);
    //out_color = demo_pulsing(uvpos);
}