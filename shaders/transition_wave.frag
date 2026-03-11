#version 450

layout(location = 0) in vec2 v_uv;
layout(location = 0) out vec4 f_color;

layout(set = 0, binding = 0) uniform sampler2D u_old;
layout(set = 0, binding = 1) uniform sampler2D u_new;

layout(push_constant) uniform PushConstants {
    float progress;
    float angle;      // wave direction in degrees
    float pos_x;
    float pos_y;
    float wave_x;     // wave frequency X
    float wave_y;     // wave amplitude Y
} pc;

void main() {
    float rad = radians(pc.angle);
    vec2 direction = vec2(cos(rad), sin(rad));

    // Sinusoidal wave distortion along the wipe front
    float proj = dot(v_uv, direction);
    float perp = dot(v_uv, vec2(-direction.y, direction.x));

    // Wave offset shifts the wipe boundary sinusoidally
    float wave_offset = sin(perp * pc.wave_x) * pc.wave_y * 0.01;

    float max_proj = abs(direction.x) + abs(direction.y);
    float t = proj / max_proj;

    float edge = 0.02;
    float threshold = pc.progress + wave_offset;
    float mask = smoothstep(threshold - edge, threshold + edge, t);

    vec4 old_color = texture(u_old, v_uv);
    vec4 new_color = texture(u_new, v_uv);
    f_color = mix(new_color, old_color, mask);
}
