package com.ozzyozbourne.mongo;

import io.quarkus.mongodb.reactive.ReactiveMongoClient;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class Service {

    private static final String DATABASE = "dbs";
    private final ReactiveMongoClient mongoClient;

    @Inject
    public Service(final ReactiveMongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    public Uni<List<Fruit>> get(){
        return mongoClient
                .getDatabase(DATABASE)
                .getCollection("fruit", Fruit.class)
                .find()
                .collect().asList();
    }
}
