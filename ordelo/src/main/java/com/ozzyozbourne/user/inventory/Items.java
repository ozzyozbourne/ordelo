package com.ozzyozbourne.user.inventory;

public record Items(Long ItemId,
                    String ItemName,
                    Long vendorId,
                    String vendorName,
                    Long storeId,
                    String storeName,
                    String storeAddress,
                    Long quantity,
                    Double price) {}
