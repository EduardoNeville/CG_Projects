Task RT1.1: Implement Ray-Plane intersections
	Finding the intersection between the ray and a plane was a matter of implementing the implicit function and solving for t. 

	The rest was a matter of dealing with fringe cases like the two sided nature of the plane. We create the scenes corner1 and corner2.

Task RT1.2.1: Deriving the expressions for a Ray-Cylinder intersection 
	Whist implementing the ray-cylinder intersection we found our biggest problem in correctly finding an implicit function to describe the cylinder. 

	Despite this we were able to solve the inequality that followed from equaling the ray equation to the cylinder's implicit equation solving for t gave us a quadratic equation with two, one, or zero values. 

	Two means that the ray traspases the cylinder and intersects in two different locations, in which case the first one will be the intersection as the light from the ray will hit it first. One means that the ray intersects the cylinder only one place and doesn't cross into the cylinder. Zero means there is no intersection.

Task RT1.2.2: 
	In the same fashion as for the ray-plane intersection we first solved the expresion and then found t. In this case given that the solution came in quadratic form we have to evaluate each case separately.
  
As a side note, generating the scenes created bizarre figures which helped us debug our intersection funcitons and was an interesting way of debuging.

We then saved the images that the program output as asked for.

We divided the work equally between the three of us therefore it was split 33% to each. 

  
