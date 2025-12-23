-- Add Quickbase and SmartSuite communities
INSERT INTO communities (name, description, discord_invite_url, transaction_fee_percent)
VALUES 
  (
    'Quickbase',
    'The Quickbase community - Connect with Quickbase developers, share knowledge, and collaborate on projects.',
    'https://discord.gg/GEZ42k9qe4',
    0.00
  ),
  (
    'SmartSuite',
    'The SmartSuite community - Join SmartSuite users and developers to build amazing solutions together.',
    'https://discord.gg/DwycavNaaD',
    0.00
  )
ON CONFLICT DO NOTHING;
