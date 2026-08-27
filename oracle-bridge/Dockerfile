FROM php:8.3-cli-bookworm

SHELL ["/bin/bash", "-lc"]
ENV DEBIAN_FRONTEND=noninteractive \
    TZ=Asia/Jakarta

RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip libaio1 build-essential autoconf pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Oracle Instant Client (Linux x64) — same redistributable zip already used by
# service-civitas, reused as a plain binary artifact here. Not civitas's codebase.
COPY oracle-instanclient/instantclient-*linux.x64-19*.zip /tmp/

RUN set -euo pipefail \
    && mkdir -p /opt/oracle && cd /opt/oracle \
    && basic="$(ls -1 /tmp/instantclient-basic*-linux.x64-19*.zip | head -n1)" \
    && sdk="$(ls -1 /tmp/instantclient-sdk-linux.x64-19*.zip | head -n1)" \
    && unzip -oq "${basic}" \
    && IC_DIR="$(ls -d /opt/oracle/instantclient_19_* | head -n1)" \
    && unzip -oq "${sdk}" -d "${IC_DIR}" \
    && if compgen -G "${IC_DIR}/instantclient_19_*/sdk" > /dev/null; then \
    mv "${IC_DIR}"/instantclient_19_*/sdk "${IC_DIR}/"; rm -rf "${IC_DIR}"/instantclient_19_*; \
    fi \
    && ln -sfn "$(basename "$(ls -1 ${IC_DIR}/libclntsh.so.* | sort -V | tail -n1)")" "${IC_DIR}/libclntsh.so" \
    && ln -sfn "$(basename "$(ls -1 ${IC_DIR}/libocci.so.* | sort -V | tail -n1)")" "${IC_DIR}/libocci.so" \
    && echo "${IC_DIR}" > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig \
    && rm -f /tmp/instantclient-*.zip

RUN set -euo pipefail \
    && IC_DIR="$(cat /etc/ld.so.conf.d/oracle-instantclient.conf)" \
    && export LD_LIBRARY_PATH="${IC_DIR}" \
    && printf "instantclient,%s" "${IC_DIR}" | pecl install -f oci8 \
    && echo "extension=oci8" > /usr/local/etc/php/conf.d/20-oci8.ini \
    && echo "date.timezone=Asia/Jakarta" > /usr/local/etc/php/conf.d/00-timezone.ini

WORKDIR /app
COPY public /app/public

EXPOSE 8080
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]
