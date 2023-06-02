# Asteroid

```js
// Fly towards target point
const dir = vec3.normalize([0,0,0], vec3.subtract([0,0,0], this.end_point, this.start_point));
vec3.scaleAndAdd(this.position, this.start_point, dir, Math.min(this.speed*this.age, this.duration));

const M_position = mat4.create();
```

# Scene Actors

```js
const asteroid_actor = init_asteroid(regl, resources, {
  size: 0.01,
  start_point: [.3, .3, .5],
  end_point: [0., 0., -.03],
  speed: 0.01,
  texture_name: "moonColor.jpeg",
});

const particles = {};

const smoke_tail = {
  size: 0.005,
  type: "fbm",
  position: asteroid_actor.position,
  velocity: [0.1, 0.1, 0.17],
  system_velocity: [0., 0., 0.],
  count: 5000,
  initial_count: 10,
  frequency: 0.001,
  spawn_count: 50,
  lifetime: 1.5,
  rand_pos: 0.005,
  rand_velocity: 0.006,
  start_color: [0.3, 0.3, 0.3, 1.0],
  end_color: [0.7, 0.7, 0.7, 0.5],
};
particles['smoke'] = init_particle_system(regl, resources, smoke_tail);


// Fire tail
const fire_tail = {
  size: 0.005,
  type: "turbulence",
  position: asteroid_actor.position,
  velocity: [0.02, 0.02, 0.034],
  system_velocity: [0., 0., 0.],
  count: 5000,
  initial_count: 10,
  frequency: 0.0001,
  spawn_count: 50,
  lifetime: 2.,
  rand_pos: 0.01,
  rand_velocity: 0.005,
  start_color: [1., 0.4, 0., 1.0],
  end_color: [1., 1., 0., 0.5],
};
particles['fire'] = init_particle_system(regl, resources, fire_tail);
```

# Sim control

```js
function activate_follow_asteroid() {
  cam_angle_z = -1.855;
  cam_angle_y = -0.51;
  cam_distance_factor = 0.1;

  cam_target = asteroid_actor.position;
  cam_follow = true;
}
activate_follow_asteroid();
register_button_with_hotkey('btn-follow-asteroid', '2', activate_follow_asteroid);

function toggle_fire() {
  particles['fire'].enabled = !particles['fire'].enabled;
}
register_button_with_hotkey('btn-toggle-fire', 'f', toggle_fire);

function toggle_smoke() {
  particles['smoke'].enabled = !particles['smoke'].enabled;
}
```

# Particle actor

```js
constructor({size, type, position, velocity, rand_pos, rand_velocity, sim_time, lifetime, custom_shader, start_color, end_color, ...rest}, regl, resources) {
     this.mat_model_to_world = mat4.create();
     this.mat_mvp = mat4.create();
  
     this.init_pipeline(regl, resources, type, custom_shader);
  
     this.size = size;
  this.color = vec4.create();
  this.start_color = start_color;
  this.end_color = end_color;
     this.mat_scale = mat4.fromScaling(mat4.create(), [this.size, this.size, this.size]);
  this.offset = [0,0,0];
  this.position = position;
  if (velocity === undefined) {
    this.velocity = [0,0,0];
  } else {
    this.velocity = vec3.clone(velocity);
   }

  if (rand_pos !== undefined) {
    vec3.add(this.offset, this.offset, vec3.random([0,0,0], rand_pos));
  }
  if (rand_velocity !== undefined) {
    vec3.add(this.velocity, this.velocity, vec3.random([0,0,0], rand_velocity));
  }
  
  this.age = 0;
  this.lifetime = lifetime;
  this.last_sim_time = sim_time === undefined ? 0 : sim_time;
}

reset({size, type, position, velocity, rand_pos, rand_velocity, sim_time, lifetime, custom_shader}) {
  this.offset = [0,0,0];
  if (velocity === undefined) {
    this.velocity = [0,0,0];
  } else {
    this.velocity = vec3.clone(velocity);
   }

  if (rand_pos !== undefined) {
    vec3.add(this.offset, this.offset, vec3.random([0,0,0], rand_pos));
  }
  if (rand_velocity !== undefined) {
    vec3.add(this.velocity, this.velocity, vec3.random([0,0,0], rand_velocity));
  }
  
  this.age = 0;
  this.last_sim_time = sim_time === undefined ? 0 : sim_time;      
}

calculate_model_matrix({camera_position, sim_time}) {
  this.age += sim_time - this.last_sim_time;
  this.last_sim_time = sim_time;

  const percent = this.age / this.lifetime;
  vec4.lerp(this.color, this.start_color, this.end_color, percent);

  const M_tmp = mat4.create();

  const position = vec3.add([0,0,0], vec3.add([0,0,0], this.position, this.offset), vec3.scale([0,0,0], this.velocity, this.age));

  const new_normal = vec3.normalize([0., 0., 0.], vec3.subtract([0.,0.,0.], camera_position, position));
    const new_normal = vec3.normalize([0., 0., 0.], camera_position);
  const normal_xy = vec3.normalize([0.,0.,0.], vec3.subtract([0.,0.,0.], new_normal, vec3.scale([0.,0.,0.], [0.,0.,1.], vec3.dot([0.,0.,1.], new_normal))));
  let angle = Math.acos(vec3.dot([0., 1., 0.,], normal_xy));
  if (normal_xy[0] > 0) {
    angle = Math.PI*2 - angle;
  }
  mat4.fromZRotation(M_tmp, angle);
  
  const rot_axis = vec3.cross([0., 0., 0.], [0., 0., 1.], new_normal);
  mat4.fromRotation(this.mat_model_to_world, Math.acos(vec3.dot([0., 0., 1.], new_normal)), rot_axis);
  
  
  mat4.multiply(this.mat_model_to_world, this.mat_model_to_world, M_tmp);
  mat4.multiply(this.mat_model_to_world, this.mat_scale, this.mat_model_to_world);

  const pos_mat = mat4.fromTranslation([0,0,0], position);
  
  mat4.multiply(this.mat_model_to_world, pos_mat, this.mat_model_to_world);
}
```

# Particle emitter

```js
constructor(options, regl, resources) {
  const {size, type, position, velocity, system_velocity, initial_count, count, frequency, spawn_count, lifetime, custom_shader} = options;
  this.enabled = false;
  
  this.size = size;
  this.type = type;
  this.position = position;
  this.velocity = velocity || [0,0,0];
  this.system_velocity = system_velocity || [0,0,0];

  this.count = count;
  this.last_spawn = 0;
  this.frequency = frequency;
  this.spawn_count = spawn_count;

  this.lifetime = lifetime;

  if (!options['start_color']) {
    options.start_color = [1., 0., 0., 1.];
  }
  if (!options['end_color']) {
    options.end_color = [1., 1., 0., 0.5];
  }

  this.regl = regl;
  this.resources = resources;
  this.options = options;
  this.options.sim_time = 0;

  this.particles = [];

  for (let i = 0; i < initial_count; ++i) {
    this.particles.push(init_particle(regl, resources, options));
  }
}

calculate_model_matrix(frame) {
  vec3.add(this.position, this.position, vec3.scale([0,0,0], this.system_velocity, frame.sim_time - this.options.sim_time));
  this.options.sim_time = frame.sim_time;
  if (this.particles.length < this.count && frame.sim_time - this.last_spawn > this.frequency) {
    this.last_spawn += this.frequency;
    for (let i = 0; i < Math.min(this.count - this.particles.length, this.spawn_count); ++i) {
      this.particles.push(init_particle(this.regl, this.resources, this.options));
    }
  }
  for (let index = 0; index < this.particles.length; ++index) {
    if (this.particles[index].age > this.lifetime) {
      if (frame.sim_time - this.last_spawn > this.frequency) {
        this.last_spawn = frame.sim_time;
        this.particles[index].reset(options);
      } else {
        this.particles.splice(index, 1);
        --index;
        continue;
      }
    }
    const particle = this.particles[index];
    particle.calculate_model_matrix(frame);
  }
}
```

# Particle shader

```c
float alpha_from_texture = texture2D(noise_tex, v2f_tex_coord).r;

float alpha_dist = 2. - pow(2., distance(v2f_tex_coord, vec2(.5, .5)));
float alpha_res = alpha_from_texture * alpha_dist;
     
if (color.a * alpha_res < 0.5) {
    discard;
}

gl_FragColor = vec4(color.rgb, color.a * alpha_res);
```

# Terrain fragment shader

```c
vec3 material_color = terrain_color_water;
float shininess = 30.0;
if (height > terrain_water_level) {
    material_color = mix(terrain_color_grass, terrain_color_mountain,   (height - terrain_water_level)*2.0);
    shininess = 2.0;
}

vec3 color = material_color * ambient;
vec3 n_v2f_normal = normalize(v2f_normal);
vec3 n_v2f_dir_to_light = normalize(v2f_dir_to_light);
vec3 n_v2f_dir_from_view = normalize(v2f_dir_from_view);
float diffuse = dot(n_v2f_normal, n_v2f_dir_to_light);
if (diffuse > 0.) {
    vec3 n_half_vec = normalize(-n_v2f_dir_from_view + n_v2f_dir_to_light);
    float diff_spec = diffuse;
    if (dot(n_v2f_normal, n_half_vec) > 0.) {
            diff_spec += pow(dot(n_half_vec, n_v2f_normal), shininess);
    }
      color += light_color * material_color * diff_spec;
}

gl_FragColor = vec4(color, 1.);
```

# Terrain vertex shader

```c
vec4 vertex_view_pos = mat_model_view * position_v4;
v2f_dir_from_view = vec3(vertex_view_pos);
v2f_dir_to_light = vec3(light_position - vertex_view_pos);
v2f_normal = mat_normals * normal;

gl_Position = mat_mvp * position_v4;
```

# Asteroid vertex shader

```c
gl_Position = uMvpMatrix * displace;
vPosition = vec3(uModelMatrix * aPosition);
vNormal = normalize(mat3(uNormalMatrix) * aNormal);
vTexCoord = aTexCoord;
```

# Terrain built mesh

```js
vertices[idx] = [gx/grid_width-0.5, gy/grid_height-0.5, Math.max(WATER_LEVEL, elevation)]
if (elevation < WATER_LEVEL) {
      normals[idx] = [0, 0, 1]
}

for(let gy = 0; gy < grid_height - 1; gy++) {
  for(let gx = 0; gx < grid_width - 1; gx++) {
      const a = xy_to_v_index(gx, gy)
      const b = xy_to_v_index(gx+1, gy)
      const c = xy_to_v_index(gx, gy+1)
      const d = xy_to_v_index(gx+1, gy+1)

      faces.push([a, b, c])
      faces.push([b, d, c])
  }
}
```

# Noise fragment shader

```c
float perlin_noise_1d(float x){
  float c0 = floor(x);
  float c1 = c0 + 1.0;

  vec2 g0 = gradients(hash_func(vec2(c0, 0.0)));
  vec2 g1 = gradients(hash_func(vec2(c1, 0.0)));

  float v0 = g0.x * (x - c0);
  float v1 = g1.x * (x - c1);

  float t = blending_weight_poly(x - c0);

  float v = mix(v0, v1, t);

  return v;
}

float perlin_fbm_1d(float x) {
  float fbm_1d=0.;
  float ampl_multiplier_pow = 1.;
  float freq_multiplier_pow = 1.;
  for(int i=0; i<num_octaves;i++){
    fbm_1d += ampl_multiplier_pow*perlin_noise_1d(x*freq_multiplier_pow);
    ampl_multiplier_pow *= ampl_multiplier;
    freq_multiplier_pow *= freq_multiplier;
  }
  return fbm_1d;
}

float perlin_noise(vec2 point) {
  
  // Find the two grid points that surround x
  float cwest = floor(point.x);
  float ceast = cwest + 1.0;
  float csouth = floor(point.y);
  float cnorth = csouth + 1.0;

  // Look up the gradients at the grid points
  vec2 g00 = gradients(hash_func(vec2(cwest, csouth)));
  vec2 g01 = gradients(hash_func(vec2(ceast, csouth)));
  vec2 g10 = gradients(hash_func(vec2(cwest, cnorth)));
  vec2 g11 = gradients(hash_func(vec2(ceast, cnorth)));

  // Calculate the contributiotns of each corner
  float s = dot(g00 , vec2(point.x - cwest, point.y -csouth));  // vec2 is a 
  float t = dot(g01 , vec2(point.x - ceast, point.y - csouth)); // vec2 is b 
  float u = dot(g10 , vec2(point.x - cwest, point.y - cnorth)); // vec2 is c
  float v = dot(g11 , vec2(point.x - ceast, point.y - cnorth)); // vec2 is d

  // Interpolate the contributions
  float f_x = blending_weight_poly(point.x - cwest);
  float f_y = blending_weight_poly(point.y - csouth);

  float st = mix(s, t, f_x);
  float uv = mix(u, v, f_x);
  float noise = mix(st, uv, f_y);


	return noise;
}

vec3 tex_map(vec2 point) {

  float alpha = perlin_fbm(point);
  vec3 color;
  if(alpha < terrain_water_level){
          color = terrain_color_water;
  }else {
          float alpha = (alpha - terrain_water_level) / (1.0 - terrain_water_level);
          color = mix(terrain_color_grass, terrain_color_mountain, alpha);
  }
  return color;
}
```
