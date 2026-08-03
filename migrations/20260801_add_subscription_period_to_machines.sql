ALTER TABLE machines
ADD COLUMN subscription_period INTEGER DEFAULT 1 CHECK(subscription_period >= 1)