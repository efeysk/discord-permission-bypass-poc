# discord-permission-bypass-poc

> [!WARNING]
> **Yalnızca Eğitim ve Güvenlik Araştırması Amacıyla**
>
> Bu proje, Discord masaüstü uygulamasının JavaScript çalışma ortamındaki istemci tarafı yetki kontrollerinin nasıl değiştirilebileceğini incelemek amacıyla hazırlanmıştır.
>
> Projenin amacı kod analizi, güvenlik farkındalığı ve istemci tarafı yetkilendirme mekanizmalarının anlaşılmasıdır.
>
> **Bu kod gerçek yönetici yetkisi kazandırmaz, sunucu sahipliğini değiştirmez ve Discord'un sunucu tarafındaki yetkilendirme mekanizmalarını aştığını kanıtlamaz.**

## Proje Hakkında

Bu depo, Webpack tabanlı bir uygulamanın çalışma zamanında dahili modüllerinin nasıl incelenebileceğini ve belirli JavaScript fonksiyonlarının nasıl değiştirilebileceğini gösteren bir kavram kanıtı (PoC) içerir.

Kod; uygulama içerisindeki izin, kullanıcı ve sunucu bilgilerini yöneten nesneleri bulmaya, bazı izin kontrolü fonksiyonlarını değiştirmeye ve sunucu sahipliğiyle ilişkili yerel kontrollerin davranışını incelemeye çalışır.

Bu çalışma, istemci tarafında yapılan değişikliklerin uygulama davranışını nasıl etkileyebileceğini göstermek için hazırlanmıştır.

## Projenin Amaçları

Bu projenin temel eğitim hedefleri şunlardır:

- Webpack modüllerinin çalışma zamanında nasıl incelenebildiğini anlamak.
- JavaScript modül dışa aktarımlarının belirli özelliklere göre nasıl aranabildiğini öğrenmek.
- Fonksiyonların çalışma zamanında değiştirilmesinin sonuçlarını incelemek.
- İstemci tarafındaki izin kontrollerinin neden tek başına güvenlik sağlamadığını anlamak.
- İstemci ve sunucu tarafındaki yetkilendirme arasındaki farkı kavramak.
- JavaScript üzerinde yapılan değişikliklerin uygulama kararlılığına etkilerini değerlendirmek.
- Değiştirilen fonksiyonların güvenilir biçimde geri yüklenmesinin neden önemli olduğunu görmek.

## Çalışma Mantığı

### 1. Webpack Modüllerine Erişim

Kod, Discord istemcisinin dahili modül yapısına erişmek için `webpackChunkdiscord_app` nesnesini kullanmayı dener.

Ardından mevcut modül dışa aktarımlarını inceleyerek belirli metotlara sahip nesneleri arar.

Bu yöntem, uygulamanın dahili uygulama ayrıntılarına bağlıdır ve resmî veya kararlı bir API değildir. Discord'un uygulama güncellemeleri sonucunda çalışmayı bırakabilir.

### 2. Dahili Store Nesnelerinin Bulunması

Kod, aşağıdaki üç nesneyi bulmaya çalışır:

- `PermissionStore`: İzin kontrolleriyle ilişkili işlevler.
- `UserStore`: Geçerli kullanıcı bilgileri.
- `GuildStore`: Sunucu bilgileri.

Bu nesneler, dışa aktardıkları metotların adlarına göre tespit edilmeye çalışılır.

Gerekli nesneler bulunamazsa kod bir uyarı mesajı verir ve çalışmayı durdurur.

### 3. İzin Kontrolü Fonksiyonlarının Değiştirilmesi

Kod, belirli izin kontrolü fonksiyonlarını her çağrıldıklarında `true` döndürecek şekilde değiştirmeye çalışır.

Bu yaklaşım, istemci tarafındaki bir kontrolün değiştirilmesinin uygulamanın yerel davranışını nasıl etkileyebileceğini gösterir.

Ancak burada kritik bir ayrım vardır:

**Bir istemci fonksiyonunun `true` döndürmesi, kullanıcının Discord sunucularında gerçekten o izne sahip olduğu anlamına gelmez.**

Discord'un sunucu tarafındaki sistemleri, korunan işlemleri gerçekleştirirken kullanıcının gerçek yetkilerini ayrıca kontrol edebilir. Kullanıcının yetkisi yoksa istek reddedilebilir.

### 4. Sunucu Sahipliği Kontrollerinin Değiştirilmesi

Kod, aşağıdaki metotların davranışını değiştirmeye çalışır:

- `isOwner`
- `isOwnerWithRequiredMfaLevel`

Bu değişiklikler, istemcideki sunucu sahipliği ve ek kimlik doğrulama gereksinimleriyle ilgili kontrollerin sonucunu etkileyebilir.

Ancak bu işlem, Discord sunucusunun gerçek sahibini değiştirmez. Ayrıca özgün metotların uyguladığı ek güvenlik koşullarını da doğru şekilde korumayabilir.

### 5. Değişiklikleri Geri Alma Mekanizması

Kod, `cleanupPermissionOverrides()` adlı bir fonksiyon tanımlar.

Bu fonksiyon, önceden kaydedilmiş bazı fonksiyonları eski hâline döndürmeye çalışır.

Ancak mevcut uygulamada bütün değiştirilen fonksiyonların özgün hâlleri kaydedilmemektedir. Sunucu sahipliği metotları ve bazı izin kontrolleri de eksiksiz biçimde geri yüklenmemektedir.

**Bu nedenle temizleme fonksiyonunun tüm değişiklikleri geri alacağı garanti edilemez.**

Güvenilir bir geri alma mekanizması için değiştirilen tüm özelliklerin özgün değerleri veya özellik tanımlayıcıları saklanmalı ve her değişiklik için uygun bir geri yükleme işlemi yapılmalıdır.

## Güvenlik Analizi

### İstemci Tarafı ve Sunucu Tarafı Yetkilendirme

Modern uygulamalarda temel güvenlik ilkelerinden biri, istemcinin güvenilir bir yetki kaynağı olarak kabul edilmemesidir.

İstemci tarafındaki JavaScript kodu kullanıcı tarafından değiştirilebilir. Bu nedenle arayüzdeki izin göstergeleri, düğme görünürlüğü veya yerel rol kontrolleri tek başına erişim güvenliği sağlayamaz.

Güvenli bir sistemde sunucu tarafı, korunan işlemleri bağımsız olarak doğrulamalıdır. Örneğin:

- Sunucu ayarlarının değiştirilmesi.
- Kanal ve rollerin yönetilmesi.
- Üye yönetimi ve moderasyon işlemleri.
- Sunucu sahipliği gerektiren işlemler.
- Ek kimlik doğrulama veya yetkilendirme gerektiren işlemler.

Sunucu tarafındaki bir API, kullanıcının gerçek yetkilerini kontrol etmek yerine yalnızca istemcinin bildirdiği bir izin sonucuna güveniyorsa bu durum ayrı bir yetkilendirme güvenlik açığı oluşturabilir.

Ancak bu depodaki kod tek başına böyle bir açığın varlığını kanıtlamaz.

## Olası Riskler

### Uygulama Kararlılığı

Dahili fonksiyonların beklenmeyen değerler döndürmesi, uygulamanın bazı bölümlerinde hatalara veya tutarsız davranışlara neden olabilir.

### Yanlış Yetki Algısı

Kullanıcılar, yerel arayüzdeki değişiklikleri gerçek yönetici yetkisi kazandıkları şeklinde yorumlayabilir. Oysa yerel bir değişiklik, sunucudaki yetki kayıtlarını değiştirmez.

### Eksik Geri Yükleme

Temizleme fonksiyonunun tüm değişiklikleri geri yüklememesi, bazı davranış değişikliklerinin oturum boyunca devam etmesine neden olabilir.

### Sürüm Uyumsuzluğu

Discord'un dahili modül yapısı değiştiğinde kod çalışmayabilir veya beklenmeyen sonuçlar üretebilir.

### Güvenilmeyen Kodların Çalıştırılması

Benzer kodlar başka kişiler tarafından değiştirilebilir ve içeriklerine kimlik bilgilerini toplama veya harici sunuculara veri gönderme gibi davranışlar eklenebilir.

İncelenen kod parçasında doğrudan bir ağ isteği, webhook üzerinden veri aktarımı veya açık bir kimlik bilgisi hırsızlığı davranışı görülmemektedir. Bu değerlendirme yalnızca sunulan kodla sınırlıdır ve farklı kaynaklardan alınan ek kodların güvenli olduğunu göstermez.

## Teknik Sınırlamalar

Projenin bilinen sınırlamaları şunlardır:

1. Discord'un belgelenmemiş dahili uygulama yapısına bağımlıdır.
2. Modül adları ve dışa aktarılan metotlar sürümler arasında değişebilir.
3. Fonksiyonların değiştirilmesi arayüzün başka bölümlerini etkileyebilir.
4. Bazı metotlar bulunamayabilir veya farklı özellik tanımlayıcıları üzerinden sunulabilir.
5. Temizleme mekanizması bütün değişiklikleri geri yüklememektedir.
6. Yerel sahiplik kontrollerinin değiştirilmesi gerçek sunucu sahipliğini değiştirmez.
7. İstemci tarafındaki bir değişiklik, korunan bir sunucu işleminin başarılı olacağını göstermez.
8. Kodun tüm Discord sürümlerinde çalıştığı doğrulanmamıştır.

## Sorumlu Güvenlik Araştırması

Bu projeyi inceleyen kişilerin aşağıdaki ilkelere uyması önerilir:

- Testleri yalnızca yetkili olduğunuz sistemlerde gerçekleştirin.
- Başkalarının verilerine veya yetki gerektiren işlemlerine izinsiz erişmeye çalışmayın.
- İstemci tarafındaki arayüz değişikliklerini gerçek bir sunucu tarafı güvenlik açığı olarak tanıtmayın.
- Yetkisiz erişimi teşvik eden kullanımlardan kaçının.
- Deneylerin tekrarlanabilir olması için uygulama sürümünü ve test ortamını belgeleyin.
- Gerçek bir güvenlik açığından şüpheleniyorsanız uygun resmî bildirim kanalını kullanın.
- Günlüklerde, ekran görüntülerinde ve örneklerde token, kişisel bilgi veya diğer hassas verileri paylaşmayın.

## Geliştiriciler İçin Güvenlik Önerileri

Bu örnek, uygulama geliştiricileri açısından şu güvenlik ilkelerini hatırlatır:

- Yetkilendirmeyi sunucu tarafında uygulayın.
- Hassas API işlemlerinde kullanıcının yetkilerini bağımsız olarak doğrulayın.
- İstemciden gelen rol, izin ve sahiplik bilgilerini güvenilir kabul etmeyin.
- Gizli veya devre dışı arayüz öğelerini güvenlik mekanizması olarak kullanmayın.
- Yetkisiz işlem denemelerini uygun şekilde kaydedin ve inceleyin.
- Yetkilendirme testlerini yalnızca resmî arayüz üzerinden değil, ilgili API sınırlarında da gerçekleştirin.
- Yetki doğrulanamadığında işlemi reddeden güvenli varsayılanlar kullanın.

## Sorumluluk Reddi

Bu proje yalnızca eğitim, kod incelemesi ve güvenlik araştırması amacıyla sunulmaktadır.

Bu depo resmî bir Discord projesi değildir ve Discord tarafından desteklenmemekte veya onaylanmamaktadır.

Kod herhangi bir garanti olmaksızın sunulmaktadır. Kullanıcılar yürürlükteki yasalara, platform politikalarına ve test yaptıkları ortamın yetkilendirme koşullarına uymaktan kendileri sorumludur.

Bu kavram kanıtı, Discord'un sunucu tarafı yetkilendirme sisteminde bir güvenlik açığı bulunduğunun kanıtı olarak değerlendirilmemelidir.

# README.md dosyası ChatGPT yardımıyla hazırlanmıştır.

## Lisans

Bu depoyu dağıtmadan önce kullanım amacınıza uygun bir açık kaynak lisansı seçin.

Bu README tek başına herhangi bir lisans hakkı vermez.
