# Introducere Kubernetes

Este un gestionar de containere, care oferă o perspectivă unitară asupra managementului serverelor.

Kubernetes rulează peste Docker ca set de API-uri puse la dispoziție de containere prin care sunt acționate.

Kubernetes a fost gândit să ruleze în contextul orchestrării mai multor servere. Kubernetes este un set de containere, CLI-uri și configurări.

Cine gestionează serverele care pot fi containere sau alte tehnologii de containerizare sunt servere de tip master care constituie ceea ce se numește *control plane*. Un server de master va trebui să ruleze mai multe containere pentru a gestiona sistemul. Unul dintre acestea este *etcd* care este un sistem distribuit de storage (chei/valori). Un altul este dedicat API-ului care gestionează clusterul prin comenzile pe care le emite. Un alt container este *scheduler* care gestionează unde și în ce condiții sunt puse containerele în nodurile existente. Containerele care sunt distribuite în noduri ajung în niște obiecte speciale numite *pods*. Un alt container este *controller manager*-ul care investighează clusterul pentru a vedea cine rulează și folosește API-ul pentru a face acest lucru. Containerul *Core DNS* care oferă mijloace de coordonare la nivel de rețea.

Restul nodurilor vor avea nevoie să ruleze un agent numit *kubelet* care rulează în propriul container. Pentru a controla traficul de rețea nodurile vor folosi *kube-proxy* care este tot un container.

Pod-urile sunt unitățile de bază dintr-un sistem Kubernetes. Containerele rulează în pod-uri. Controllerele gestionează pod-urile și prin intermediul lor sunt create pod-urile.

Kubernetes oferă și servicii care sunt mijlocul prin care ne conectăm la un pod.

Mai există un concept de lucru important numit *namespaces*, care este un filtru (filtrare de views în lucrul cu CLI) ce poți să-l aplici cu scopul de a grupa obiectele dintr-un cluster.