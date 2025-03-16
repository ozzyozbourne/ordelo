package com.ozzyozbourne.mongo;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("mongo")
@Produces(MediaType.APPLICATION_JSON)
public class Resource {

    private final Service service;

    @Inject
    public Resource(final Service service) {
        this.service = service;
    }

    @GET
    public Uni<List<Fruit>> getFruit(){
        return service.get();
    }
}
