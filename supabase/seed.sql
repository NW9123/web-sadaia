-- =============================================================================
-- TripMind — seed.sql
-- Demo catalog data: a handful of destinations and sample places matching the
-- ids used by the app (src/data/destinations.ts, src/data/places/*).
--
-- IMPORTANT
--   * This seeds the PUBLIC CATALOG only. Trips, days, activities, hotels,
--     flights and budgets are created PER USER at runtime once someone signs in
--     and generates a plan — never seed them here.
--   * All prices, ratings and costs below are DEMO ESTIMATES (DataMeta.source =
--     'demo', isEstimated = true). avg_daily_cost is a per-person estimate in SAR.
--   * Coordinates are real-world so the itinerary/map features look correct.
--   * ON CONFLICT DO NOTHING keeps this file safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Destinations (6): istanbul, dubai, london, cairo, bali, tbilisi.
-- image_url uses the same Unsplash pattern as the app's data layer.
-- -----------------------------------------------------------------------------
insert into public.destinations (
  id, city_ar, city_en, country_ar, country_en, country_code,
  lat, lng, image_url, avg_daily_cost, currency, flight_time_hours, weather,
  best_seasons_ar, best_seasons_en, description_ar, description_en,
  popularity, is_active
) values
  ('istanbul', 'إسطنبول', 'Istanbul', 'تركيا', 'Türkiye', 'TR',
   41.0082, 28.9784,
   'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1200&q=70',
   420, 'SAR', 3.5, 'mild',
   'أبريل – يونيو، سبتمبر – نوفمبر', 'Apr–Jun, Sep–Nov',
   'مدينة تجمع بين قارتين وتاريخ عريق وأسواق نابضة ومطبخ لا يُقاوم.',
   'A city spanning two continents with deep history, lively bazaars and irresistible food.',
   98, true),

  ('dubai', 'دبي', 'Dubai', 'الإمارات', 'UAE', 'AE',
   25.2048, 55.2708,
   'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=70',
   650, 'SAR', 2, 'warm',
   'نوفمبر – مارس', 'Nov–Mar',
   'وجهة عصرية فاخرة بأطول مبنى في العالم وتسوق عالمي وشواطئ وترفيه للعائلة.',
   'A modern luxury destination with the world''s tallest tower, world-class shopping and family fun.',
   96, true),

  ('london', 'لندن', 'London', 'المملكة المتحدة', 'United Kingdom', 'GB',
   51.5074, -0.1278,
   'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=70',
   780, 'SAR', 6.5, 'cool',
   'مايو – سبتمبر', 'May–Sep',
   'عاصمة عالمية بمتاحف مجانية ومسارح ومعالم أيقونية وحدائق واسعة.',
   'A global capital of free museums, theatre, iconic landmarks and sprawling parks.',
   94, true),

  ('cairo', 'القاهرة', 'Cairo', 'مصر', 'Egypt', 'EG',
   30.0444, 31.2357,
   'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1200&q=70',
   280, 'SAR', 2.5, 'warm',
   'أكتوبر – أبريل', 'Oct–Apr',
   'موطن الأهرامات والمتحف المصري وتاريخ يمتد آلاف السنين.',
   'Home of the Pyramids, the Egyptian Museum and millennia of history.',
   88, true),

  ('bali', 'بالي', 'Bali', 'إندونيسيا', 'Indonesia', 'ID',
   -8.4095, 115.1889,
   'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=70',
   350, 'SAR', 9, 'warm',
   'أبريل – أكتوبر', 'Apr–Oct',
   'جزيرة استوائية بشواطئ وحقول أرز خضراء ومعابد ساحرة.',
   'A tropical island of beaches, emerald rice terraces and enchanting temples.',
   90, true),

  ('tbilisi', 'تبليسي', 'Tbilisi', 'جورجيا', 'Georgia', 'GE',
   41.7151, 44.8271,
   'https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=1200&q=70',
   300, 'SAR', 3, 'mild',
   'مايو – أكتوبر', 'May–Oct',
   'طبيعة خلابة وجبال وأسعار مناسبة وأجواء لطيفة صيفًا.',
   'Stunning nature, mountains, friendly prices and pleasant summers.',
   82, true)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Places — Istanbul (6). Ids/coords match src/data/places/istanbul.ts.
-- -----------------------------------------------------------------------------
insert into public.places (
  id, destination_id, name_ar, name_en, category,
  description_ar, description_en, address_ar, address_en,
  lat, lng, rating, review_count, price_level, tags,
  opening_hours_ar, opening_hours_en, source
) values
  ('ist-hagia-sophia', 'istanbul', 'آيا صوفيا', 'Hagia Sophia', 'landmark',
   'تحفة معمارية بيزنطية تحولت من كنيسة إلى مسجد وتُعد من أشهر معالم إسطنبول على الإطلاق.',
   'A Byzantine architectural masterpiece turned church, museum and mosque that is Istanbul''s most iconic monument.',
   'ميدان السلطان أحمد، منطقة الفاتح، إسطنبول', 'Sultanahmet Square, Fatih, Istanbul',
   41.0086, 28.9802, 4.8, 254000, 2, array['history','museums','photography'],
   '09:00 – 19:00', '09:00 – 19:00', 'demo'),

  ('ist-blue-mosque', 'istanbul', 'الجامع الأزرق', 'Blue Mosque', 'landmark',
   'مسجد السلطان أحمد الشهير بقبابه المتدرجة ومآذنه الست وبلاطه الأزرق الخلاب.',
   'The famous Sultan Ahmed Mosque, celebrated for its cascading domes, six minarets and stunning blue tilework.',
   'ميدان السلطان أحمد، منطقة الفاتح، إسطنبول', 'Sultanahmet Square, Fatih, Istanbul',
   41.0054, 28.9768, 4.7, 168000, 1, array['history','photography','quiet'],
   '08:30 – 18:00 (يُغلق أوقات الصلاة)', '08:30 – 18:00 (closed at prayer times)', 'demo'),

  ('ist-topkapi-palace', 'istanbul', 'قصر توبكابي', 'Topkapi Palace', 'museum',
   'المقر الرئيسي لسلاطين العثمانيين لأربعة قرون، ويضم كنوزاً نفيسة وأمانات مقدسة وحدائق مطلة على البوسفور.',
   'The primary residence of Ottoman sultans for four centuries, housing priceless treasures, sacred relics and gardens overlooking the Bosphorus.',
   'منطقة الفاتح، إسطنبول', 'Cankurtaran, Fatih, Istanbul',
   41.0115, 28.9834, 4.6, 132000, 2, array['history','museums','photography'],
   '09:00 – 18:00 (مغلق الثلاثاء)', '09:00 – 18:00 (closed Tuesdays)', 'demo'),

  ('ist-grand-bazaar', 'istanbul', 'البازار الكبير', 'Grand Bazaar', 'shopping',
   'أحد أقدم وأكبر الأسواق المغطاة في العالم بأكثر من أربعة آلاف متجر للمجوهرات والسجاد والتحف.',
   'One of the world''s oldest and largest covered markets, with over four thousand shops for jewellery, carpets and antiques.',
   'منطقة الفاتح، إسطنبول', 'Beyazit, Fatih, Istanbul',
   41.0106, 28.9680, 4.4, 214000, 2, array['shopping','history','photography'],
   '09:00 – 19:00 (مغلق الأحد)', '09:00 – 19:00 (closed Sundays)', 'demo'),

  ('ist-bosphorus-cruise', 'istanbul', 'رحلة بحرية في مضيق البوسفور', 'Bosphorus Cruise', 'activity',
   'جولة بالقارب بين قارتي آسيا وأوروبا تكشف القصور والقلاع والجسور على ضفتي المضيق.',
   'A boat tour between the Asian and European shores revealing palaces, fortresses and bridges along the strait.',
   'رصيف إمينونو، منطقة الفاتح، إسطنبول', 'Eminonu Pier, Fatih, Istanbul',
   41.0169, 28.9770, 4.6, 47000, 2, array['photography','adventure','kidsFriendly'],
   '10:00 – 20:00', '10:00 – 20:00', 'demo'),

  ('ist-galata-tower', 'istanbul', 'برج غلطة', 'Galata Tower', 'landmark',
   'برج حجري من العصور الوسطى يوفر إطلالة بانورامية ساحرة على المدينة القديمة والقرن الذهبي.',
   'A medieval stone tower offering a sweeping panoramic view over the old city and the Golden Horn.',
   'منطقة بي أوغلو، إسطنبول', 'Bereketzade, Beyoglu, Istanbul',
   41.0256, 28.9744, 4.5, 96000, 2, array['photography','history','hiddenGems'],
   '08:30 – 22:00', '08:30 – 22:00', 'demo')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Places — Dubai (6). Ids/coords match src/data/places/dubai.ts.
-- -----------------------------------------------------------------------------
insert into public.places (
  id, destination_id, name_ar, name_en, category,
  description_ar, description_en, address_ar, address_en,
  lat, lng, rating, review_count, price_level, tags,
  opening_hours_ar, opening_hours_en, source
) values
  ('dxb-burj-khalifa', 'dubai', 'برج خليفة', 'Burj Khalifa', 'landmark',
   'أطول مبنى في العالم، ويضم منصات مراقبة توفر إطلالة بانورامية مذهلة على دبي والصحراء والخليج.',
   'The world''s tallest building, with observation decks offering a stunning panorama of Dubai, the desert and the Gulf.',
   'وسط مدينة دبي، دبي', '1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
   25.1972, 55.2744, 4.7, 312000, 3, array['photography','history','kidsFriendly'],
   '08:30 – 23:00', '08:30 – 23:00', 'demo'),

  ('dxb-dubai-mall', 'dubai', 'دبي مول', 'The Dubai Mall', 'shopping',
   'أحد أكبر مراكز التسوق في العالم، يضم آلاف المتاجر وحوض أسماك ضخماً وحلبة تزلج ونافورة راقصة.',
   'One of the world''s largest malls, with thousands of stores, a giant aquarium, an ice rink and a dancing fountain.',
   'وسط مدينة دبي، دبي', 'Financial Center Rd, Downtown Dubai',
   25.1985, 55.2796, 4.6, 289000, 3, array['shopping','kidsFriendly','restaurants'],
   '10:00 – 00:00', '10:00 – 00:00', 'demo'),

  ('dxb-dubai-fountain', 'dubai', 'نافورة دبي', 'The Dubai Fountain', 'entertainment',
   'أكبر نافورة راقصة في العالم تتراقص مياهها على أنغام الموسيقى أمام برج خليفة كل مساء.',
   'The world''s largest choreographed fountain, dancing to music in front of Burj Khalifa every evening.',
   'بحيرة برج خليفة، وسط مدينة دبي، دبي', 'Burj Khalifa Lake, Downtown Dubai',
   25.1955, 55.2748, 4.8, 176000, 1, array['events','photography','kidsFriendly'],
   '18:00 – 23:00 (عروض كل نصف ساعة)', '18:00 – 23:00 (shows every 30 minutes)', 'demo'),

  ('dxb-palm-jumeirah', 'dubai', 'نخلة جميرا', 'Palm Jumeirah', 'landmark',
   'جزيرة اصطناعية على شكل نخلة تضم الفنادق الفاخرة والشواطئ والمنتجعات وقطار المونوريل.',
   'A palm-shaped man-made island lined with luxury hotels, beaches, resorts and a monorail.',
   'نخلة جميرا، دبي', 'Palm Jumeirah, Dubai',
   25.1124, 55.1390, 4.6, 98000, 2, array['photography','beaches','kidsFriendly'],
   '24 ساعة', '24 hours', 'demo'),

  ('dxb-burj-al-arab', 'dubai', 'برج العرب', 'Burj Al Arab', 'landmark',
   'فندق أيقوني على شكل شراع يُعد رمزاً للفخامة في دبي ويقف على جزيرة خاصة قبالة الشاطئ.',
   'An iconic sail-shaped hotel that is a symbol of Dubai luxury, standing on its own island off the shore.',
   'شارع جميرا، دبي', 'Jumeirah St, Umm Suqeim 3, Dubai',
   25.1412, 55.1853, 4.7, 84000, 4, array['photography','beaches'],
   '24 ساعة (زيارة بحجز مسبق)', '24 hours (visits by reservation)', 'demo'),

  ('dxb-dubai-marina', 'dubai', 'دبي مارينا', 'Dubai Marina', 'landmark',
   'حي عصري على قناة مائية تحيط به ناطحات السحاب واليخوت والمطاعم وممشى ساحلي حيوي.',
   'A modern waterfront district around a canal, ringed by skyscrapers, yachts, restaurants and a lively promenade.',
   'دبي مارينا، دبي', 'Dubai Marina, Dubai',
   25.0805, 55.1403, 4.6, 121000, 2, array['photography','restaurants','events'],
   '24 ساعة', '24 hours', 'demo')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Places — London (6). Ids/coords match src/data/places/london.ts.
-- -----------------------------------------------------------------------------
insert into public.places (
  id, destination_id, name_ar, name_en, category,
  description_ar, description_en, address_ar, address_en,
  lat, lng, rating, review_count, price_level, tags,
  opening_hours_ar, opening_hours_en, source
) values
  ('lon-british-museum', 'london', 'المتحف البريطاني', 'British Museum', 'museum',
   'متحف عالمي يضم كنوز الحضارات من حجر رشيد إلى منحوتات البارثينون والمومياوات المصرية، والدخول مجاني.',
   'A world museum holding civilisation''s treasures from the Rosetta Stone to the Parthenon sculptures and Egyptian mummies, free to enter.',
   'شارع غريت راسل، بلومزبري، لندن', 'Great Russell St, Bloomsbury, London',
   51.5194, -0.1270, 4.8, 214000, 1, array['museums','history','kidsFriendly'],
   '10:00 – 17:00', '10:00 – 17:00', 'demo'),

  ('lon-tower-of-london', 'london', 'برج لندن', 'Tower of London', 'landmark',
   'قلعة تاريخية على ضفاف نهر التايمز تحرس جواهر التاج البريطاني وتروي قروناً من الحكايات والحرّاس.',
   'A historic riverside fortress guarding the Crown Jewels and telling centuries of stories and its famous Beefeaters.',
   'طريق البرج، لندن', 'Tower Hill, London',
   51.5081, -0.0759, 4.6, 98000, 3, array['history','museums','kidsFriendly'],
   '09:00 – 17:30', '09:00 – 17:30', 'demo'),

  ('lon-london-eye', 'london', 'عين لندن', 'London Eye', 'attraction',
   'عجلة مراقبة عملاقة على ضفة التايمز توفر إطلالة بانورامية على معالم المدينة من كبائنها الزجاجية.',
   'A giant observation wheel on the Thames offering a panoramic view of the city''s landmarks from its glass capsules.',
   'الضفة الجنوبية، لندن', 'Riverside Building, South Bank, London',
   51.5033, -0.1196, 4.5, 156000, 3, array['photography','kidsFriendly','events'],
   '11:00 – 18:00', '11:00 – 18:00', 'demo'),

  ('lon-buckingham-palace', 'london', 'قصر باكنغهام', 'Buckingham Palace', 'landmark',
   'المقر الرسمي للملك في لندن، ويشتهر بمراسم تغيير الحرس أمام بوابته المذهّبة.',
   'The King''s official London residence, famous for the Changing of the Guard ceremony at its gilded gates.',
   'لندن SW1A 1AA', 'Westminster, London SW1A 1AA',
   51.5014, -0.1419, 4.6, 132000, 1, array['history','photography','events'],
   'تغيير الحرس 11:00 (أيام محددة)', 'Changing of the Guard 11:00 (select days)', 'demo'),

  ('lon-big-ben', 'london', 'بيغ بن', 'Big Ben', 'landmark',
   'برج الساعة القوطي الشهير الملحق بمباني البرلمان، وأحد أبرز رموز لندن على الإطلاق.',
   'The famous Gothic clock tower attached to the Houses of Parliament, one of London''s most iconic symbols.',
   'وستمنستر، لندن', 'Westminster, London SW1A 0AA',
   51.5007, -0.1246, 4.7, 118000, 1, array['history','photography'],
   '24 ساعة (المنظر الخارجي)', '24 hours (exterior view)', 'demo'),

  ('lon-tower-bridge', 'london', 'جسر البرج', 'Tower Bridge', 'landmark',
   'جسر متحرك أيقوني ببرجيه المزدوجين وممر زجاجي علوي يطل على نهر التايمز.',
   'An iconic bascule bridge with twin towers and a high-level glass walkway overlooking the Thames.',
   'طريق جسر البرج، لندن', 'Tower Bridge Rd, London',
   51.5055, -0.0754, 4.7, 102000, 2, array['history','photography','kidsFriendly'],
   '09:30 – 18:00', '09:30 – 18:00', 'demo')
on conflict (id) do nothing;

-- =============================================================================
-- End of seed.sql
-- =============================================================================
