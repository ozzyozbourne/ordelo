package com.ozzyozbourne.user.rest;


import com.ozzyozbourne.user.inventory.ItemName;
import com.ozzyozbourne.user.inventory.Items;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.RestQuery;

import java.util.Collection;
import java.util.List;

@Path("inventory")
@Produces(MediaType.APPLICATION_JSON)
public final class Endpoints {

    @GET
    @Path("items")
    public Collection<Items> availability(@RestQuery final List<ItemName> itemNames) {
        return List.of(
                new Items(1L, "TestItem1", 10L,
                        "TestVendor1", 212L, "TestStore1", "TestAddress1", 10L, 100.0),

                new Items(2L, "TestItem2", 100L,
                        "TestVendor2", 2123L, "TestStore3", "TestAddress2", 10L, 100.0)
        );
    }

}
