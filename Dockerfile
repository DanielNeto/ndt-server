FROM measurementlab/ndt

RUN apt-get update && \
    apt-get install -y nginx net-tools vim iputils-ping && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY nginx/default /etc/nginx/sites-available/

COPY start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /

ENTRYPOINT ["/start.sh"]
