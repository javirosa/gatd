GATD: Get All The Data
======================

GATD is a cloud based system for managing and storing data streams. It was
born out of a need to handle data generated by disparate sensors with varying
data types, transmission protocols, and end-use goals.

GATD has three major design goals:

1. *Modularity*. GATD is a relatively loose collection of modules connected with
infinite length queues and a database layer. Each module is part of a certain
block of the system and many modules can exist for the same block. For example,
in the receiver block there is one module that listens for UDP packets and
another module that listens for HTTP requests. This allows GATD to be trivially
extended as functionality changes and new sensors come online.

2. *Flexibility*. GATD makes virtually no assumptions about the format, type,
or content of any data coming into the system. The exclusive requirement is
that a sensor must be able to identify its data stream to the system so it
can be processed properly. Each data stream has a custom parser that knows
how to make sense of its own data. The parser simply returns key,value pairs
with no restrictions on the key names or value types. GATD is designed to adapt
to the sensors, and not vice-versa.

3. *Timeliness*. GATD is specifically designed to support real-time streaming
applications where data comes in as it is generated and is sent out
to interested clients immediately. Every component is optimized for this
workflow. Additionally, all data is stored and can be retrieved and processed
later if necessary.


Structure
---------

diagram

The major blocks of GATD are as follows:

- *Receiver*. Responsible for accepting data from any sensors. Records
all relevant metadata with the data before passing it all to the formatter.

- *Formatter*. The formatter is a stateless block that converts raw data
from sensors into key,value pairs. The formatter calls the appropriate
parser to interpret the raw data before storing them in a database and
passing them on to any streamers.

- *Streamer*. The streamer block sends data to any interested clients.
Clients register a query with a streamer and any matching packets are sent
to the client.


Implementation
--------------

The current version of GATD is a research oriented implementation designed
for speed of development and experimentability rather than performance.
Most modules are written in Python, although due to the loose, modular approach
some are written in Node.js and C as well.

GATD uses RabbitMQ for the inter-module queues and MongoDB for data storage.

### Requirements

- Python 2.7.*
  - pika
  - IPy
  - pymongo
  - socketio
- MongoDB
- RabbitMQ
  - rabbitmq-c
- Node.js
  - npm
  - amqp
  - underscrore
  - query-engine
  - simple-ini
  - socket.io
  - forever


Installation
------------

The following instructions are for Ubuntu.

1. Install [MongoDB](http://docs.mongodb.org/manual/installation/),
[RabbitMQ Server](http://www.rabbitmq.com/download.html), and
[Node.js](http://nodejs.org/download/).

2. Install dependencies

    ```
    sudo apt-get install python-pip git vim python-dev cmake libssl-dev
    ```
    
2. Setup user and checkout gatd. You will also want to add yourself to the `gatd` group and then log out and back in.

    ```
    sudo adduser gatd
    cd /opt
    sudo clone https://github.com/lab11/gatd.git
    sudo chown gatd:gatd gatd
    sudo usermod -a -G gatd <username>
    ```
    
2. Copy the example GATD config file and set the necessary values. You will want to make sure any passwords set
in the next steps are reflected in this file.

    ```
    cd gatd/config
    cp gatd.config.example gatd.config
    ```

2. Configure MongoDB using the template config file in the `mongo` folder.
  1. Copy the config file to `/etc/mongodb.conf`.

        ```
        sudo cp gatd/mongo/mongodb.conf /etc/mongodb.conf
        ```

  2. Edit the config file with the port you want to use.
  3. Create a directory for the database.

        ```
        sudo mkdir -p /data/mongodb
        sudo chown mongodb:mongodb /data/mongodb
        ```
        
  4. Start the MongoDB daemon.

        ```
        sudo service mongodb start
        ```

3. Configure RabbitMQ using the config files in the `rabbitmq` folder.
  1. Copy the config files to `/etc/rabbitmq`.

        ```
        sudo cp gatd/rabbitmq/rabbitmq* /etc/rabbitmq
        ```
  
  2. Edit `rabbitmq-gatd.config` with the port you want to use.
  3. Restart the rabbitmq server.
  
        ```
        sudo rabbitmqctrl stop
        sudo service rabbitmq-server start
        ```

  4. Delete the default rabbitmq user, create a GATD user, and set permissions.
  
        ```
        sudo rabbitmqctl delete_user guest
        sudo rabbitmqctl add_user gatd <password>
        sudo rabbitmqctl set_user_tags gatd administrator
        sudo rabbitmqctl set_permissions -p / gatd ".*" ".*" ".*"
        ```


4. Set up Python environment

    ```bash
    sudo pip2 install virtualenv
    cd /opt/gatd
    virtualenv .
    source ./bin/activate
    pip2 install pika IPy pymongo gevent-socketio socketio-client semantic_version gevent
    ```
    
5. Install the [rabbitmq-c](https://github.com/alanxz/rabbitmq-c) library for compiling the UDP receiver.
Use the cmake install directions that end up with the library installed.
It also seems that you need to set the library directory after this. Add the following to `.bashrc`:

    ```
    export LD_LIBRARY_PATH=/usr/local/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
    ```

6. Install [tup](http://gittup.org/tup/), a software build tool.

7. Compile the receiver.

    ```
    cd receiver
    tup
    ```

8. Install the Node.js dependencies

    ```bash
    cd streamer
    sudo npm install -g forever
    npm install
    ```

9. Setup the database in MongoDB.

    ```
    cd mongo
    ./init_mongo.py
    ````
10. Run GATD
  1. Start the receivers.
  
        ```
        cd receiver
        ./run_receiver.sh
        ```

  2. Run the formatter.
    
        ```
        cd formatter
        ./run_formatter.sh
        ```

  3. Run the streamers.
   
        ```
        cd streamer
        ./run_streamer.sh
        ```







