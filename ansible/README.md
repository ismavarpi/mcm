# Ansible Deployment

Este directorio contiene un playbook sencillo para desplegar la aplicación MCM.

## Uso rápido

1. Modifique el archivo `inventory` con las direcciones de los servidores
a los que desea desplegar la aplicación.
2. Ajuste en `deploy.yml` las variables `app_dir` y `repo_url` si es
necesario.
3. Ejecute el playbook:

```bash
ansible-playbook -i inventory deploy.yml
```

El playbook instala Node.js y pm2, clona el repositorio, instala las
dependencias y arranca el servidor con pm2.
