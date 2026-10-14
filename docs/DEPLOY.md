# Despliegue en VPS (ambiente de pruebas)

Frontend estático (Vite build) servido por nginx dentro de un contenedor Podman.
nginx además hace de reverse proxy hacia el backend (.NET), que corre en el mismo
VPS, para que todas las llamadas queden en el mismo origen (`http://IP_DEL_VPS/...`)
y no haya que lidiar con CORS ni URLs absolutas. No hay dominio/SSL todavía: el
acceso es por IP y HTTP plano — aceptable para un ambiente de pruebas interno, no
para producción.

## 1. Requisitos en el VPS

```bash
sudo apt update && sudo apt install -y podman   # Debian/Ubuntu
# o: sudo dnf install -y podman                  # RHEL/Fedora/Alma
```

## 2. Red compartida entre frontend y backend

Para que nginx pueda resolver el contenedor del backend por nombre:

```bash
podman network create muric-net
```

El contenedor del backend debe correr en esa misma red y exponer su puerto HTTP
internamente (no hace falta publicarlo al host con `-p`, solo que esté en la red):

```bash
podman run -d --name muric-backend --network muric-net <imagen-backend>
```

> Ajusta `nginx.conf` (`location /odata/` y `/api/`) si el contenedor del backend
> no se llama `muric-backend` o no escucha en el puerto `8080`.

## 3. Build de la imagen del frontend

Desde la raíz del repo (en el VPS, tras `git clone`/`git pull`):

```bash
podman build -t muric-frontend .
```

Esto corre `npm ci && npm run build` con las variables de `.env.production`
(`VITE_API_URL=/odata/v1`, `VITE_API_URL_SECURITY=/api`, rutas relativas al
mismo origen) y empaqueta el `dist/` resultante en una imagen nginx:alpine.

## 4. Levantar el contenedor

```bash
podman run -d \
  --name muric-frontend \
  --network muric-net \
  -p 80:80 \
  muric-frontend
```

Verificar: `http://<IP_DEL_VPS>/login` debe cargar la app.

## 5. Abrir el puerto en el firewall (si aplica)

```bash
sudo ufw allow 80/tcp        # Debian/Ubuntu con ufw
# o
sudo firewall-cmd --add-port=80/tcp --permanent && sudo firewall-cmd --reload
```

## 6. Que sobreviva a reinicios del VPS (opcional, recomendado)

```bash
loginctl enable-linger $USER   # si se corre podman rootless
podman generate systemd --new --files --name muric-frontend
mkdir -p ~/.config/systemd/user
mv container-muric-frontend.service ~/.config/systemd/user/
systemctl --user enable --now container-muric-frontend.service
```

## 7. Redeploy manual (cada vez que haya cambios)

```bash
git pull
podman build -t muric-frontend .
podman stop muric-frontend && podman rm muric-frontend
podman run -d --name muric-frontend --network muric-net -p 80:80 muric-frontend
```

## Pendiente para cuando deje de ser "ambiente de pruebas"

- Dominio + HTTPS (Let's Encrypt/certbot) en vez de IP + HTTP plano.
- Automatizar el redeploy (GitHub Actions) en vez de `git pull` manual.
- Revisar los `console.log` de token/auth en `axiosSecurityAPIClient.ts` (quedan
  visibles en la consola del navegador; no son un problema de servidor pero
  conviene limpiarlos antes de un ambiente más expuesto).
