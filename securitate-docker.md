# Securitatea în Docker

Docker vine din oficiu cu două tehnologii care privesc securitatea. Este vorba despre Docker Scout și Docker Content Trust.

## Docker Scout

Este un scaner de vulnerabilități. Poți rula un `quickview` pentru o anumită imagine. Pentru instalare, vezi https://github.com/docker/scout-cli.

```bash
 docker scout quickview alpine
    i New version 1.23.1 available (installed version is 1.20.3) at https://github.com/docker/scout-cli
    ✓ Image stored for indexing
    ✓ Indexed 20 packages

    i Base image was auto-detected. To get more accurate results, build images with max-mode provenance attestations.
      Review docs.docker.com ↗ for more information.

 Target   │  alpine:latest  │    0C     0H     0M     0L  
   digest │  d529dd0c6e55   │                             

What's next:
    Include policy results in your quickview by supplying an organization → docker scout quickview alpine --org <organization>
```

Pentru a identifica problemele în amănunt, rulează cu `cves`.

```bash
docker scout cves alpine
    i New version 1.23.1 available (installed version is 1.20.3) at https://github.com/docker/scout-cli
    ✓ SBOM of image already cached, 20 packages indexed
    ✓ No vulnerable package detected


## Overview

                   │       Analyzed Image        
───────────────────┼─────────────────────────────
 Target            │  alpine:latest              
   digest          │  d529dd0c6e55               
   platform        │ linux/amd64                 
   vulnerabilities │    0C     0H     0M     0L  
   size            │ 4.2 MB                      
   packages        │ 20                          


## Packages and Vulnerabilities

  No vulnerable packages detected
```