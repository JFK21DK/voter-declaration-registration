// tslint:disable:object-literal-sort-keys

export class Mailer {
  private readonly fromEmail: string = 'noreply@jfk21.dk';
  private client: any;

  constructor(private apiKey: string) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(apiKey);
    sgMail.setSubstitutionWrappers('[', ']');
    this.client = sgMail;
  }

  public sendVerificationEmail(name: string, email: string, link: string): Promise<any> {
    const mailData = {
      to: { name, email },
      from: { name: 'JFK21', email: this.fromEmail },
      subject: 'Vælgererklæring - email verificering',
      text: `Verificer email: ${link}`,
      html: `<a href="${link}">Verificer email</a>`,
      templateId: 'b34d5af7-87c8-4d53-9843-e229fd1465db',
      substitutions: {
        NAME: name,
        VERIFICATION_LINK: link,
      },
    };

    return this.client.send(mailData);
  }
}
