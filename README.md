# Projet AEGC

### BD MongoDB

### Backend Node.js (ExpressJS)

### Frontend React.js 


### Déploiement 
#### - Prérequis: Avoir Docker et Docker-compose installés dans le serveur de deploiement 
#### - Se placer dans le repertoire du projet dans votre PC 
#### - Se rassurer que le context docker qui pointe vers la machine distante via ssh est créé. 
Si c'est pas le ca, exécuter la commande suvante: docker context create my-ssh-context-server --docker "host=ssh://login@ip_address:ssh_port"
#### - Activer le context docker qui pointe vers la machine distante via ssh
docker context use my-ssh-context-server
#### - Exécuter la commande suivante (Le deploiement Backend et frontend vont se faire dans des conteneurs dans le serveur distant via ssh). 
docker-compose up -d 
#### - Il est possible de revenir à l'utilisation du contexte Docker local
docker context use default 

