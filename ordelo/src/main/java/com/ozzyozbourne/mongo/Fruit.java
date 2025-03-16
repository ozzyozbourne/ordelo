package com.ozzyozbourne.mongo;

import org.bson.types.ObjectId;

public record Fruit(ObjectId _id, String name, Integer quantity, Double price) {}
