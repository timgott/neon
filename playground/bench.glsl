void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float f = 2.;
    
    for(int i = 0; i < 5000; i++){
	    // Probably tested at 512x288
        //f += f*f*f*f; // 35
        //f = f*f*f*f; // 28
        //f = (f*f)*(f*f); // 35
        //f = f*(f*(f*f)); // 28
        //f = ((f*f)*f)*f; // 28
        //float g = f*f; f = g*g; // 35
        //f = f*f*f; // 35
        //f = f+f+f+f; // 29
        //f += f+f+f; // 29
        //f = sqrt(f); // 31
        //f = exp(f); // 31
        //f = sin(f); // 31
        //f = pow(f, 0.5); // 20
        //f = pow(f, 2.0); // 45
        //f = f*f; // 45
        //f *= f; // 45
        //f = pow(f, 4.0); // 35
        //f = tan(f); // 13
        //f = atan(f); // 5!!!
        //f = acos(f); // 10.5
        //f = inversesqrt(f); // 31
        //f = f/f; // 26
        //f = 1.0/2.0; // 45
        //f = 0.5; // 45
        //f += 0.5; // 45

		// Different testing day at 640x360, numbers not comparable to above
	    //f += f*f*f+f*f+f; // 17
        //f = f*(f*f+f+1.0); // 20
        //f = f*(f*(f+1.0)+1.0); // 19 (same number of ops but less parallel)

        //float g = f*f; f += dot(vec2(f,g), vec2(g,f)); // 78ms
        //float g = f*f; f += f*g+g*f; // 78ms (the same)

        //f = f / 2.0; // 30
        //f = f * 0.5; // 30
    }
    
    
    fragColor = vec4(f);
}