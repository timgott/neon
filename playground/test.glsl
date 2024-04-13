void mainImage(out vec4 out_color, in vec2 pos) {
    vec2 center = iResolution.xy * 0.5;
    float d = distance(center, pos);
    float v = 1.0 / (1.0 + d / 100.0);
    out_color = vec4(v, v, v, 1.0);
}