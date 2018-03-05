
const block = {
vshader_source:
`#version 300 es
layout (location = 0) in vec4 a_position;
layout (location = 1) in vec4 a_color;
out vec4 v_color;
void main()
{
    gl_Position = a_position;
    v_color = a_color;
}`,

fshader_source:
`#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 color;
void main()
{
    color = v_color;
}`,

};


const block_transform = {
vshader_source:
`#version 300 es
uniform float top_limit;
uniform float left_limit;
uniform float right_limit;
uniform float bottom_limit;
uniform float step;
layout (location = 0) in vec4 a_position;
layout (location = 1) in vec4 a_color;
out vec3 new_position;
out vec4 v_color;
void main()
{
    if (
        a_position.x > left_limit - 0.001 &&
        a_position.x < right_limit - 0.001 &&
        a_position.y > bottom_limit + 0.001 &&
        a_position.y < top_limit + 0.001
    ) {
        new_position = (a_position - vec4(0.0, step, 0.0, 0.0)).xyz;
        gl_Position = a_position - vec4(0.0, step, 0.0, 0.0);
    } else {
        new_position = a_position.xyz;
        gl_Position = a_position;
    }
    v_color = a_color;
}`,

fshader_source: block.fshader_source,
};

const block_scale = {
vshader_source:
`#version 300 es
uniform mat4 scale;
uniform mat4 move_in_center;
uniform mat4 move_back;
layout (location = 0) in vec4 a_position;
layout (location = 1) in vec4 a_color;
out vec4 v_color;
void main()
{
    gl_Position = move_back * scale * move_in_center * a_position;
    v_color = a_color;
}`,

fshader_source: block.fshader_source,
}

export {
    block as Block,
    block_transform as BlockTransform,
    block_scale as BlockScale
};
