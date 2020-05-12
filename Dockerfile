FROM measurementlab/ndt

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install -y nginx net-tools vim iputils-ping tzdata && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN ln -fs /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata

RUN rm -fr /html/
COPY html/* /html/
COPY nginx/default /etc/nginx/sites-available/

COPY start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /

ENTRYPOINT ["/start.sh"]
