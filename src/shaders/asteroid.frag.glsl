precision highp float;

const loc_aPosition = 3;
const loc_aNormal = 5;
const loc_aTexture = 7;

varying vec4 loc_aPosition;

uniform vec3 uLightColor;     // Light color
uniform vec3 uLightPosition;  // Position of the light source
uniform vec3 uAmbientLight;   // Ambient light color

uniform sampler2D surfaceColor;
uniform sampler2D bumpMap;
uniform sampler2D specularMap;

uniform float maxDot;

in vec3 vNormal;
in vec3 vPosition;
in vec2 vTexCoord;
out vec4 fColor;


vec2 dHdxy_fwd(sampler2D bumpMap, vec2 UV, float bumpScale)
{
    vec2 dSTdx  = dFdx( UV );
        vec2 dSTdy  = dFdy( UV );
        float Hll   = bumpScale * texture( bumpMap, UV ).x;
        float dBx   = bumpScale * texture( bumpMap, UV + dSTdx ).x - Hll;
        float dBy   = bumpScale * texture( bumpMap, UV + dSTdy ).x - Hll;
        return vec2( dBx, dBy );
}

vec3 pertubNormalArb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy)
{
    vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
        vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
        vec3 vN = surf_norm;        // normalized
        vec3 R1 = cross( vSigmaY, vN );
        vec3 R2 = cross( vN, vSigmaX );
        float fDet = dot( vSigmaX, R1 );
        fDet *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );
        vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
        return normalize( abs( fDet ) * surf_norm - vGrad );
}



void main() 
{
    vec2 dHdxy;
    vec3 bumpNormal;
    float bumpness = 1.0;
    fColor = texture(surfaceColor, vTexCoord);
    dHdxy = dHdxy_fwd(bumpMap, vTexCoord, bumpness);

    // Normalize the normal because it is interpolated and not 1.0 in length any more
    vec3 normal = normalize(vNormal);

    // Calculate the light direction and make its length 1.
    vec3 lightDirection = normalize(uLightPosition - vPosition);

    // The dot product of the light direction and the orientation of a surface (the normal)
    float nDotL;
    nDotL = max(dot(lightDirection, normal), maxDot);

    // Calculate the final color from diffuse reflection and ambient reflection
    vec3 diffuse = uLightColor * fColor.rgb * nDotL;
    vec3 ambient = uAmbientLight * fColor.rgb;
    float specularFactor = texture(specularMap, vTexCoord).r; //Extracting the color information from the image

    vec3 diffuseBump;
    bumpNormal = pertubNormalArb(vPosition, normal, dHdxy);
    diffuseBump = min(diffuse + dot(bumpNormal, lightDirection), 1.1);

    vec3 specular = vec3(0.0);
    float shiness = 12.0;
    vec3 lightSpecular = vec3(1.0);

    vec3 v = normalize(-vPosition); // EyePosition
    vec3 r = reflect(-lightDirection, bumpNormal); // Reflect from the surface
    specular = lightSpecular * specularFactor * pow(dot(r, v), shiness);

    //Update Final Color
    fColor = vec4( (diffuse * diffuseBump + specular) + ambient, fColor.a); // Specular
};

