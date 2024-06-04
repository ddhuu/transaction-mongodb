# 1. How Replication Works in MongoDB

MongoDB uses Replica Set to implement Replication. A Replica Set is a group of MongoDB instances that host the same data set. A replica set only has one primary. The primary member receives write requests. The primary writes its changes to the oplog - a file that acts like a binlog on mysqld. The secondaries will have the same data set as the primary, read requests can scale on the primary and all secondaries. A replica set can have a maximum of 50 members.

![My Image](https://raw.githubusercontent.com/wiki/ant-media/Ant-Media-Server/images/mongodbreplicaset.png)

Members always maintain connections, in case a member dies then other members will automatically be switched to standby. This is a difference compared to mysql. With this standby switching mechanism when a primary is not working then a secondary will be elected to be the primary of the entire replica set (this election can be based on default or voting) refer more carefully and how ReSplication works with MongoDB and the standby switching structure in Replica Set in the official link of MongoDB: [MongoDB Replication](https://www.mongodb.com/docs/manual/replication/)

## 2. Running MongoDB on Docker

To deploy a Replica Set on Mongo with 3 members we use docker to run MongoDB. You can refer and download Docker at [Docker](https://www.docker.com/). 

Start Docker Desktop, in the windows terminal, we download MongoDB images from the docker hub with the command: `docker pull mongo:5.0` With tag 5.0 is the version, skip the tag if you want to download the latest version, now the images of mongo have been pulled to the machine.
run the `docker images` command to check the current images

Create a separate network for MongoDB, with the command: `docker network create mongoNet` (with mongoNet is the name of the network to be created). Run the `docker network ls` command to check the newly created network.
create and run 3 mongo containers using the image just pulled with the command
`docker run -d -p 27018:27017 --net mongoNet --name r1 mongo --replSet mongoRep`

`docker run -d -p 27019:27017 --net mongoNet --name r2 mongo --replSet mongoRep`

`docker run -d -p 27020:27017 --net mongoNet --name r3 mongo --replSet mongoRep`

Here we have created 3 mongo containers r1, r2, r3 and public to localhost respectively at ports 27018, 27019, 27020

Run `docker ps` to check if the containers have been started yet

## 3. Deploying Replication in MongoDB with Docker

After having 3 MongoDB members, we proceed to configure the Replica Set for it.

Go to the terminal on container r0 with the command **docker exec -it r1 bash**. 
we proceed to config on `r1`. Identify the members as the containers r1, r2, r3 just created according to the syntax
```shell
config = {"_id": "name replSet create container [Here is mongoRep] ", "members": [{_id: 0, host: " your private IP :27018"}, {_id: 1, host: "your private IP :27019"}, {_id: 2, host: "your private IP:27020"}]}
```

```shell
rs.initiate(config)

```



Type rs. status() to see the current configuration. So we have completed the configuration of Replica Set on MongoDB, create a database to test.
 The creation or manipulation of collections only takes place on r1 which is primary in Replica Set while secondary can only update data from primary. If the primary is no longer active, the election will take place and a secondary will take over the primary

 Finally replace your string connection with ` your private ip` and `port` of **r1**.




