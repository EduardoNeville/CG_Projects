
RT2-Lighting and light rays -- Group 35


Task RT2.1: IMPLEMENT LIGHTING MODELS

To implement render_light we have to implement the given formula for global intensity I. 
The formula consists of the ambient part, which is the product of the ambient intensity and the RGB ambient coefficients, and the lighting sum, whose summands we implement in the lighting function. 

First have to check whether the ray intersets an object of the scene. Here we use the shadow acne rule from the lecture. Is this the case, we compute the ambient contribution and add it to the sum of the intensity contribution from each light. Therefore we compute the lighting function with (ray_origin + col_distance*ray_direction) for the argument object_point and (-ray_direction) for the argument direction_to_camera.   

The first result we want to achieve is to see the flat colors of the castle scene. In this case we use the originally given lighting funtion, which returns the corresponding material color.

Then we want to see how the apperance of the castle will change, if we consider the diffuse component as return in the lighting function instead of the material color. 

Finally, by adding the corresponding specular moment, we implement the Blinn-Phong and the Phong lighting model. For the first one we additionally have to compute the half vector. 

It sould be mentioned, that all vectors we use in the computations in the lighting function have length one.

The final result of task RT2.1 is also given in shading_light_BlinnPhong(_Phong), where we can observe two distinct lights, and in shading_speculars_BlinnPhong(_Phong).



Task RT2.2: IMPLENT SHADOWS

To add shadows in our scenes we modify the lighting function. 
As we have seen in the lecture, we first send the shadow ray from the intersection point to the light source position. Then we check whether an occluding object is found. 
Therefore we check if the ray_intersection function returns true and additionally check if the distance between the light position and the intersection point is greater than the collision distance. In that case we set the lighting function to zero. 
As mentioned in the task before, we also use the shadow acne rule in this task as well.

The final result of task RT2.2 is also given in desk_BlinnPhong(_Phong).



Task RT2.3.2: IMPLEMENT REFLECTIONS

Implementing reder_lights for reflections we first create an outer loop in the number of reflections to the function body what we already had. Still, there are a few things we have to add. 
First of all the ambient part as well as the lighting part are multiplied by the current reflection weight. You can find the exact formula as well as the derivation in TheoryExerciseRT2. Also, the ray_origin as well as the ray_direction is updated in every loop. We transfer the origin in the ray direction with the length of thw collision distance and reflect the direction in every loop.

The results of task RT2.3.2 are given in mirror1_BlinnPhong(_Phong), where we used one reflection, and in mirror2_BlinnPhong(_Phong), where we used two reflections.


_______________________________________________________________________________________
We divided the work equally between the three of us. 



